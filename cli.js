const axios = require('axios');
const readline = require('readline');

const SERVER_URL = 'http://localhost:5000';

// Function to get questions from the server
async function getQuestions() {
    try {
        const response = await axios.get(`${SERVER_URL}/process-image`);
        return response.data.questions.split('\n').filter(q => q.trim() !== '');
    } catch (error) {
        console.error('Error fetching questions:', error.message);
        process.exit(1);
    }
}

// Function to validate answers
async function validateAnswers(questions, userAnswers) {
    try {
        const response = await axios.post(`${SERVER_URL}/validate-answers`, { questions, userAnswers });
        return response.data.validationResults;
    } catch (error) {
        console.error('Error validating answers:', error.message);
        process.exit(1);
    }
}

// Function to ask questions in the terminal
async function askQuestions(questions) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const userAnswers = [];

    for (const question of questions) {
        const answer = await new Promise(resolve => {
            rl.question(`${question}\nYour Answer: `, resolve);
        });
        userAnswers.push(answer);
    }

    rl.close();
    return userAnswers;
}

// Main function to run the CLI
async function main() {
    const questions = await getQuestions();
    const userAnswers = await askQuestions(questions);
    const validationResults = await validateAnswers(questions, userAnswers);

    console.log('\nValidation Results:');
    console.log(validationResults);
}

main();
