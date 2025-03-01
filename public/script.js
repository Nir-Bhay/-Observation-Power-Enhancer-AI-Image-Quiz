document.getElementById('uploadButton').addEventListener('click', async () => {
    const imageInput = document.getElementById('imageInput');
    if (imageInput.files.length === 0) {
        alert('Please select an image to upload.');
        return;
    }

    const formData = new FormData();
    formData.append('image', imageInput.files[0]);

    // Show loading indicator
    const questionsContainer = document.getElementById('questionsContainer');
    questionsContainer.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const response = await fetch('https://observation-power-enhancer-ai-image-quiz.onrender.com/process-image', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        displayQuestions(data.questions);
    } catch (error) {
        console.error('Error uploading image:', error);
        questionsContainer.innerHTML = '<p class="error-message">Error processing image. Please try again.</p>';
    }
});

let currentQuestionIndex = 0;
let questions = [];
let userAnswers = [];

function displayQuestions(questionsArray) {
    questions = questionsArray;
    userAnswers = new Array(questions.length).fill(''); // Initialize userAnswers array
    currentQuestionIndex = 0;
    showQuestion(currentQuestionIndex);

    document.getElementById('navigationButtons').style.display = 'flex';
    document.getElementById('submitButton').style.display = 'none';
}

function showQuestion(index) {
    const questionsContainer = document.getElementById('questionsContainer');
    questionsContainer.innerHTML = '';

    const questionElement = document.createElement('div');
    questionElement.className = 'question';
    questionElement.innerHTML = `
        <p>${questions[index]}</p>
        <input type="text" id="answer${index}" class="answer" placeholder="Your answer" value="${userAnswers[index]}">
    `;
    questionsContainer.appendChild(questionElement);

    document.getElementById('prevButton').style.display = index === 0 ? 'none' : 'block';
    document.getElementById('nextButton').style.display = index === questions.length - 1 ? 'none' : 'block';
    document.getElementById('submitButton').style.display = index === questions.length - 1 ? 'block' : 'none';
}

document.getElementById('prevButton').addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        saveCurrentAnswer();
        currentQuestionIndex--;
        showQuestion(currentQuestionIndex);
    }
});

document.getElementById('nextButton').addEventListener('click', () => {
    if (currentQuestionIndex < questions.length - 1) {
        saveCurrentAnswer();
        currentQuestionIndex++;
        showQuestion(currentQuestionIndex);
    }
});

document.getElementById('submitButton').addEventListener('click', async () => {
    saveCurrentAnswer();

    // Show loading indicator
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const response = await fetch('https://observation-power-enhancer-ai-image-quiz.onrender.com/validate-answers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ questions, userAnswers })
        });
        const data = await response.json();
        displayResults(data.validationResults);
    } catch (error) {
        console.error('Error validating answers:', error);
        resultsContainer.innerHTML = '<p class="error-message">Error validating answers. Please try again.</p>';
    }
});

function saveCurrentAnswer() {
    const currentAnswerInput = document.getElementById(`answer${currentQuestionIndex}`);
    if (currentAnswerInput) {
        userAnswers[currentQuestionIndex] = currentAnswerInput.value;
    }
}

function displayResults(results) {
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = `<pre>${results}</pre>`;
}
