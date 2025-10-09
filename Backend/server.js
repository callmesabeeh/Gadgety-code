const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const FileType = require('file-type'); // Install this: npm install file-type
const sharp = require('sharp'); // Install this: npm install sharp
const mongoose = require('mongoose');
require('dotenv').config();
// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

const projectSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: String,
    discountedPrice: String,
    date: String,
    image: String,
    url: String,
    category: String, // Added category field
    additionalImages: [String]
});

const Project = mongoose.model('Project', projectSchema);

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Serve static files (index.html, etc.) from project root
app.use(express.static(__dirname));

// Serve index.html at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
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

        const newProject = new Project({
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            discountedPrice: req.body.discPrice,
            date: today,
            image: mainImageUrl,
            url: slug,
            additionalImages: images,
        });

        await newProject.save();

        res.status(200).send('Project uploaded successfully!');
    } catch (error) {
        console.error('Error uploading project:', error.message);
        res.status(500).send(`An error occurred while uploading the project: ${error.message}`);
    }
});


// Get all projects
app.get('/projects', async (req, res) => {
    try {
        const projects = await Project.find();
        // Map _id to id for frontend compatibility
        const mappedProjects = projects.map(project => {
            const obj = project.toObject();
            obj.id = obj._id.toString();
            delete obj._id;
            delete obj.__v;
            return obj;
        });
        res.json(mappedProjects);
    } catch (error) {
        res.status(500).send('Error reading projects data');
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
        if (!deletedProject) return res.status(404).send('Not found');
        res.json(deletedProject);
    } catch (error) {
        res.status(500).send('Error deleting project');
    }
});


// For Vercel compatibility, export the app instead of listening on a port
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
