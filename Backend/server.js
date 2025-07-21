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

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Serve static files (index.html, etc.) from project root
app.use(express.static(__dirname));

// Path to the projects JSON file
const projectsFile = path.join(__dirname, 'Data\\productsData.json');

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
        const apiKey = '5241ba333f63944be333c131617f77f6'; // Set your ImgBB API key in environment variable
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
                    await delay(1000); // 1-second delay between each upload
                } catch (error) {
                    console.error(error.message);
                }
            }
        }

        // Determine the main image
        const mainImage = req.files.find(file => file.originalname.toLowerCase().includes('main'));
        const mainImageUrl = mainImage ? await uploadToImgBB(mainImage) : images[0];

        const newProject = {
            id: Date.now(),
            title: req.body.title,
            description: req.body.description,
            price: req.body.price,
            discountedPrice: req.body.discPrice,
            date: today,
            image: mainImageUrl,
            url: slug,
            additionalImages: images,
        };

        // Read the current projects data
        let projects = [];
        if (fs.existsSync(projectsFile)) {
            const data = fs.readFileSync(projectsFile, 'utf-8');
            projects = JSON.parse(data); // Parse the JSON data
        }

        // Add the new project
        projects.push(newProject);

        // Write back the updated projects array to the file
        fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));

        res.status(200).send('Project uploaded successfully!');
    } catch (error) {
        console.error('Error uploading project:', error.message);
        res.status(500).send(`An error occurred while uploading the project: ${error.message}`);
    }
});


// Get all projects
app.get('/projects', (req, res) => {
    try {
        if (!fs.existsSync(projectsFile)) return res.json([]);
        const data = fs.readFileSync(projectsFile, 'utf-8');
        const projects = JSON.parse(data);
        res.json(projects);
    } catch (error) {
        res.status(500).send('Error reading projects data');
    }
});

// Get a single project by ID
app.get('/projects/:id', (req, res) => {
    try {
        if (!fs.existsSync(projectsFile)) return res.status(404).send('Not found');
        const data = fs.readFileSync(projectsFile, 'utf-8');
        const projects = JSON.parse(data);
        const project = projects.find(p => p.id == req.params.id);
        if (!project) return res.status(404).send('Not found');
        res.json(project);
    } catch (error) {
        res.status(500).send('Error reading project');
    }
});

// Update a project by ID
app.put('/projects/:id', (req, res) => {
    try {
        if (!fs.existsSync(projectsFile)) return res.status(404).send('Not found');
        const data = fs.readFileSync(projectsFile, 'utf-8');
        let projects = JSON.parse(data);
        const idx = projects.findIndex(p => p.id == req.params.id);
        if (idx === -1) return res.status(404).send('Not found');
        // Update fields
        projects[idx] = { ...projects[idx], ...req.body };
        fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
        res.json(projects[idx]);
    } catch (error) {
        res.status(500).send('Error updating project');
    }
});

// Delete a project by ID
app.delete('/projects/:id', (req, res) => {
    try {
        if (!fs.existsSync(projectsFile)) return res.status(404).send('Not found');
        const data = fs.readFileSync(projectsFile, 'utf-8');
        let projects = JSON.parse(data);
        const idx = projects.findIndex(p => p.id == req.params.id);
        if (idx === -1) return res.status(404).send('Not found');
        const deleted = projects.splice(idx, 1);
        fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
        res.json(deleted[0]);
    } catch (error) {
        res.status(500).send('Error deleting project');
    }
});

app.listen(5000, () => {
    console.log('Server is running on http://localhost:5000');
});
