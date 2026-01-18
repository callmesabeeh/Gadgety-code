const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const FileType = require('file-type');
const sharp = require('sharp');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// MongoDB connection with retry logic and proper error handling
const connectDB = async () => {
    // Don't try to connect if MONGODB_URI is not set
    if (!process.env.MONGODB_URI) {
        console.warn('⚠️  MONGODB_URI not set. Server will run without database connection.');
        return;
    }

    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 10000, // Increased timeout
                socketTimeoutMS: 45000,
                dbName: 'Gadgety',
                retryWrites: true,
                w: 'majority',
                maxPoolSize: 10,
                // SSL/TLS options to handle connection issues
                tls: true,
                tlsAllowInvalidCertificates: false,
                // Connection pool options
                minPoolSize: 0,
                maxIdleTimeMS: 30000,
                // Retry options
                retryReads: true
            });
            console.log('✅ Connected to MongoDB successfully');
            return;
        } catch (err) {
            retries++;
            console.error(`❌ MongoDB connection error (attempt ${retries}/${maxRetries}):`, err.message);
            
            // Provide helpful error messages
            if (err.message.includes('whitelist') || err.message.includes('IP')) {
                console.error('💡 Tip: Make sure your IP address is whitelisted in MongoDB Atlas');
                console.error('   Go to: https://cloud.mongodb.com → Network Access → Add IP Address');
            }
            if (err.message.includes('SSL') || err.message.includes('TLS')) {
                console.error('💡 Tip: SSL/TLS connection issue. Check your MongoDB connection string.');
            }
            
            if (retries === maxRetries) {
                console.error('⚠️  Failed to connect to MongoDB after multiple attempts.');
                console.error('⚠️  Server will continue running, but database operations will fail.');
                console.error('⚠️  Please check:');
                console.error('   1. MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for testing)');
                console.error('   2. MongoDB connection string in .env file');
                console.error('   3. Network connectivity');
                // Don't throw - let server continue without DB
                return;
            }
            // Wait 5 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

// Connect to MongoDB (non-blocking)
connectDB().catch(err => {
    console.error('MongoDB connection failed:', err.message);
});

// MongoDB connection error handler
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

const projectSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: String,
    discountedPrice: String,
    date: String,
    image: String,
    url: String,
    category: { type: [String], required: true }, // Added category field
    additionalImages: [String]
});

const Project = mongoose.model('Project', projectSchema);


app.use(cors({
    origin: ['https://cornermobile-backend.vercel.app', 'https://cornermobile-frontend.vercel.app', 'https://api.cornermobile.com.pk', 'https://www.cornermobile.com.pk'],
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware with detailed information
app.use((req, res, next) => {
    const start = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    console.log(`[${requestId}] ${new Date().toISOString()} - Started ${req.method} ${req.url}`);
    console.log(`[${requestId}] Headers:`, req.headers);
    
    // Log request body if present and not a file upload
    if (req.body && !req.is('multipart/form-data')) {
        console.log(`[${requestId}] Body:`, req.body);  
    }

    // Add response logging
    const oldSend = res.send;
    res.send = function(data) {
        console.log(`[${requestId}] Response time: ${Date.now() - start}ms`);
        return oldSend.apply(res, arguments);
    };

    next();
});

// Serve static files (index.html, etc.) from project root
app.use(express.static(__dirname));

// Serve index.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle favicon.ico requests
app.get('/favicon.ico', (req, res) => {
    res.status(204).end(); // No content response
});



// Utility function to generate URL-friendly slugs
function generateSlug(title) {
    return title.toLowerCase().replace(/_/g, '-');
}

// Multer setup to store images temporarily
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Function to validate and re-encode images
async function validateAndReencodeImage(file) {
    const fileType = await FileType.fromBuffer(file.buffer);

    if (!fileType) {
        console.log(`Re-encoding ${file.originalname} to PNG format.`);
        const reencodedBuffer = await sharp(file.buffer).toFormat('png').toBuffer();
        return reencodedBuffer;
    }

    // Check if the file type is supported
    const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/tiff', 'image/bmp'];
    if (!supportedTypes.includes(fileType.mime)) {
        console.log(`Re-encoding ${file.originalname} to PNG format.`);
        const reencodedBuffer = await sharp(file.buffer).toFormat('png').toBuffer();
        return reencodedBuffer;
    }

    // Re-encode the image if necessary
    if (fileType.mime !== 'image/jpeg' && fileType.mime !== 'image/png') {
        console.log(`Re-encoding ${file.originalname} to PNG format.`);
        const reencodedBuffer = await sharp(file.buffer).toFormat('png').toBuffer();
        return reencodedBuffer;
    }

    return file.buffer;
}

// Function to upload image to ImgBB
async function uploadToImgBB(file) {
    try {
        const apiKey = process.env.IMGBB_API_KEY;
        if (!apiKey) throw new Error('IMGBB_API_KEY environment variable not set.');

        // Validate and re-encode the image if necessary
        const validatedBuffer = await validateAndReencodeImage(file);

        // Convert buffer to base64
        const base64Image = validatedBuffer.toString('base64');

        // Make the request to ImgBB
        const response = await axios.post(
            `https://api.imgbb.com/1/upload?key=${apiKey}`,
            new URLSearchParams({ image: base64Image }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        return response.data.data.url; // Return the ImgBB URL
    } catch (error) {
        console.error(`Error uploading ${file.originalname} to ImgBB:`, error.response ? error.response.data : error.message);
        throw new Error(`Failed to upload ${file.originalname} to ImgBB.`);
    }
}

// Function to delay execution
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle project uploads
app.post('/upload', upload.array('images'), async (req, res) => {
    try {
        console.log('Received upload request:', {
            body: req.body,
            files: req.files ? req.files.length : 0
        });
        const projectTitle = req.body.title.replace(/\s+/g, '_').toLowerCase();
        const slug = generateSlug(projectTitle);
        const today = new Date().toISOString().slice(0, 10);

        // Upload each image to ImgBB with a 1-second delay between uploads
        const images = [];
        for (const file of req.files) {
            if(file.originalname.includes("main") === false){
                try {
                    const imgbbUrl = await uploadToImgBB(file);
                    images.push(imgbbUrl);
                    await delay(1000);
                } catch (error) {
                    console.error(error.message);
                }
            }
        }

        // Determine the main image
        const mainImage = req.files.find(file => file.originalname.toLowerCase().includes('main'));
        const mainImageUrl = mainImage ? await uploadToImgBB(mainImage) : images[0];

        // Check if MongoDB is connected
        if (mongoose.connection.readyState !== 1) {
            console.error('❌ MongoDB is not connected. Cannot save project.');
            return res.status(503).json({ 
                error: 'Database connection unavailable',
                message: 'MongoDB is not connected. Please check your database connection and try again.',
                imagesUploaded: {
                    mainImage: mainImageUrl,
                    additionalImages: images
                }
            });
        }

        const newProject = new Project({
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            discountedPrice: req.body.discPrice,
            date: today,
            image: mainImageUrl,
            url: slug,
            additionalImages: images,
            category: req.body.category || req.body.category?.[0] || 'uncategorized'
        });

        await newProject.save();

        res.status(200).send('Project uploaded successfully!');
    } catch (error) {
        console.error('Error uploading project:', error.message);
        
        // Check if it's a MongoDB connection error
        if (error.message.includes('MongoServerSelectionError') || 
            error.message.includes('connection') ||
            error.message.includes('MongoNetworkError')) {
            return res.status(503).json({ 
                error: 'Database connection error',
                message: 'Unable to connect to MongoDB. Please check your database connection.',
                details: error.message
            });
        }
        
        res.status(500).send(`An error occurred while uploading the project: ${error.message}`);
    }
});


// Get all projects
app.get('/projects', async (req, res) => {
    try {
        const projects = await Project.find().lean();
        const mappedProjects = projects.map(project => ({
            ...project,
            id: project._id.toString(),
            _id: undefined,
            __v: undefined
        }));
        res.json(mappedProjects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ 
            error: 'Error reading projects data',
            message: error.message
        });
    }
});

// Get a single project by ID
app.get('/projects/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).send('Not found');
        res.json(project);
    } catch (error) {
        res.status(500).send('Error reading project');
    }
});

// Update a project by ID
app.put('/projects/:id', async (req, res) => {
    try {
        const updatedProject = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedProject) return res.status(404).send('Not found');
        res.json(updatedProject);
    } catch (error) {
        res.status(500).send('Error updating project');
    }
});

// Delete a project by ID
app.delete('/projects/:id', async (req, res) => {
    try {
        const deletedProject = await Project.findByIdAndDelete(req.params.id);
        if (!deletedProject) return res.status(404).json({ error: 'Project not found' });
        res.json(deletedProject);
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ 
            error: 'Error deleting project',
            message: error.message
        });
    }
});

// Global error handling middleware - must be last
app.use((err, req, res, next) => {
    const errorId = Math.random().toString(36).substring(7);
    
    // Log detailed error information
    console.error(`[Error ${errorId}] ${new Date().toISOString()}`);
    console.error(`[Error ${errorId}] URL: ${req.method} ${req.url}`);
    console.error(`[Error ${errorId}] Error:`, err);
    console.error(`[Error ${errorId}] Stack:`, err.stack);
    
    // Send appropriate error response
    const statusCode = err.status || 500;
    res.status(statusCode).json({ 
        error: {
            id: errorId,
            message: process.env.NODE_ENV === 'production' 
                ? 'An unexpected error occurred' 
                : err.message,
            type: err.name || 'InternalServerError',
            status: statusCode,
            path: req.url,
            timestamp: new Date().toISOString(),
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
        }
    });
});

// For Vercel compatibility
module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('Waiting for requests...');
    
    // Add middleware to log all requests
    app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      next();
    });
  });
}
