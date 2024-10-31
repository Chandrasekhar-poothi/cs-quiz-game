const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = 3000;

const uri = 'mongodb+srv://chandrasekharp2004:chandra%4022@cs-quiz-game.nietw.mongodb.net/?retryWrites=true&w=majority&appName=cs-quiz-game'
const client = new MongoClient(uri);

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
async function connectDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Database connection failed:', error);
    }
}

// Serve questions.json file via an API endpoint
app.get('/api/questions', (req, res) => {
    const questionsFilePath = path.join(__dirname, 'questions.json');

    fs.readFile(questionsFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading questions.json:', err);
            return res.status(500).send('Error reading questions file');
        }

        const questionsData = JSON.parse(data);
        const selectedQuestions = {};

        for (const topic in questionsData) {
            const questions = questionsData[topic];
            const shuffled = questions.sort(() => 0.5 - Math.random());
            selectedQuestions[topic] = shuffled.slice(0, 10);
        }

        res.json(selectedQuestions);
    });
});

// Route for the signup page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Handle signup form submission
app.post('/signup', async (req, res) => {
    const userData = {
        name: req.body.name,
        age: req.body.age,
        username: req.body.username,
        password: req.body.password,
    };

    try {
        const database = client.db('cs-quiz-game'); // Use your database name
        const usersCollection = database.collection('users'); // Use your collection name

        // Check if the username already exists
        const existingUser = await usersCollection.findOne({ username: userData.username });
        if (existingUser) {
            return res.status(400).send('Username already exists');
        }

        // Insert new user
        await usersCollection.insertOne(userData);
        console.log('User data saved successfully.');
        res.send(`
            <script>
                sessionStorage.setItem('username', '${userData.username}');
                window.location.href = 'index1.html';
            </script>
        `);
    } catch (error) {
        console.error('Error saving user data:', error);
        res.status(500).send('Server Error');
    }
});

// Route for the login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Handle login form submission
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const database = client.db('cs-quiz-game'); // Use your database name
        const usersCollection = database.collection('users'); // Use your collection name

        // Fetch existing users
        const user = await usersCollection.findOne({ username }); // Find user by username

        if (!user) {
            return res.send(`
                <script>
                    alert("Oops! This user doesn't exist. Please sign up first.");
                    window.location.href = 'signup.html';
                </script>
            `);
        }

        // Check password
        if (user.password !== password) {
            return res.send(`
                <script>
                    alert("Incorrect password. Please try again.");
                    window.location.href = 'login.html';
                </script>
            `);
        }

        // Successful login
        console.log('User logged in:', username);
        res.send(`
            <script>
                sessionStorage.setItem('username', '${username}');
                window.location.href = 'index1.html';
            </script>
        `);
    } catch (error) {
        console.error('Error reading user data:', error);
        return res.status(500).send('Server Error');
    }
});

// Start the server and connect to MongoDB
app.listen(PORT, () => {
    connectDB(); // Connect to MongoDB when the server starts
    console.log(`Server is running on http://localhost:${PORT}`);
});
