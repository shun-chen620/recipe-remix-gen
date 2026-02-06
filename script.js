// Replace your actual n8n webhook URL here
const WEBHOOK_URL = 'http://localhost:5678/webhook/recipe-generator';

// Theme Management
function initTheme() {
    // Transfer theme from html to body if needed
    const htmlTheme = document.documentElement.classList.contains('dark-theme') ? 'dark' : 'light';
    setTheme(htmlTheme);
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

function setTheme(theme) {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${theme}-theme`);
    document.documentElement.classList.remove('light-theme', 'dark-theme');
    document.documentElement.classList.add(`${theme}-theme`);
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// Common ingredient list
const commonIngredients = [
    '鶏肉', 'サーモン', '牛肉', '豆腐', '卵',
    'トマト', '玉ねぎ', 'にんにく', 'ほうれん草', 'きのこ',
    'バジル', 'パセリ', 'レモン', '生姜', 'チーズ',
    '豚肉', 'じゃがいも', 'にんじん', 'キャベツ', '長ネギ',
    '大根', 'ナス', 'ピーマン', 'アボカド', 'ブロッコリー'
];

// Recipe generation function
async function generateRecipe() {
    const ingredient1 = document.getElementById('ingredient1').value.trim();
    const ingredient2 = document.getElementById('ingredient2').value.trim();
    const ingredient3 = document.getElementById('ingredient3').value.trim();
    
    if (!ingredient1 || !ingredient2 || !ingredient3) {
        showError('3つの食材をすべて入力してください！');
        return;
    }
    
    hideError();
    hideRecipe();
    setLoading(true);
    
    try {
        console.log('Sending request to:', WEBHOOK_URL);
        console.log('With data:', { ingredient1, ingredient2, ingredient3 });
        
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ingredient1,
                ingredient2,
                ingredient3
            })
        });
        
        // 🔍 DEBUG INFO
        console.log('Response status:', response.status);
        console.log('Response statusText:', response.statusText);
        console.log('Response OK:', response.ok);
        
        const rawText = await response.text();
        console.log('Raw response text:', rawText);
        
        if (!response.ok) {
            throw new Error(`レシピの生成に失敗しました (Status: ${response.status})`);
        }
        
        // Try to parse JSON
        const data = JSON.parse(rawText);
        console.log('Parsed data:', data);
        
        const result = Array.isArray(data) ? data[0] : data;
        console.log('Final result:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'レシピの生成に失敗しました');
        }
        
        displayRecipe(result.recipe);
        saveToHistory(result.recipe, ingredient1, ingredient2, ingredient3);
        
    } catch (error) {
        console.error('完全なエラー:', error);
        showError('問題が発生しました。もう一度お試しください。');
    } finally {
        setLoading(false);
    }
}
// Recipe display function
function displayRecipe(recipe) {
    // Set title
    document.getElementById('recipeTitle').textContent = recipe.title;
    
    // Set cooking time
    if (recipe.cookingTime) {
        document.getElementById('cookingTime').textContent = `調理時間: ${recipe.cookingTime}`;
    }
    
    // Set ingredients
    const ingredientsList = document.getElementById('ingredientsList');
    ingredientsList.innerHTML = '';
    recipe.ingredients.forEach(ingredient => {
        const li = document.createElement('li');
        li.textContent = ingredient;
        ingredientsList.appendChild(li);
    });
    
    // Set instructions
    const instructionsList = document.getElementById('instructionsList');
    instructionsList.innerHTML = '';
    recipe.instructions.forEach(instruction => {
        const li = document.createElement('li');
        li.textContent = instruction;
        instructionsList.appendChild(li);
    });
    
    // Set serving suggestions
    if (recipe.servingSuggestions) {
        document.getElementById('servingSuggestions').textContent = recipe.servingSuggestions;
        document.getElementById('servingSection').style.display = 'block';
    } else {
        document.getElementById('servingSection').style.display = 'none';
    }
    
    // Display recipe card
    document.getElementById('recipeCard').classList.remove('hidden');
    
    // Scroll to recipe
    document.getElementById('recipeCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Random ingredient selection function
function randomizeIngredients() {
    const shuffled = [...commonIngredients].sort(() => 0.5 - Math.random());
    document.getElementById('ingredient1').value = shuffled[0];
    document.getElementById('ingredient2').value = shuffled[1];
    document.getElementById('ingredient3').value = shuffled[2];
}

// Set loading state
function setLoading(isLoading) {
    const btn = document.getElementById('generateBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    
    btn.disabled = isLoading;
    btnText.style.display = isLoading ? 'none' : 'inline';
    btnLoader.style.display = isLoading ? 'inline' : 'none';
}

// Show error
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

// Hide error
function hideError() {
    document.getElementById('errorMessage').classList.add('hidden');
}

// Hide recipe
function hideRecipe() {
    document.getElementById('recipeCard').classList.add('hidden');
}

// Save to history
function saveToHistory(recipe, ing1, ing2, ing3) {
    const history = JSON.parse(localStorage.getItem('recipeHistory') || '[]');
    history.unshift({
        recipe,
        ingredients: [ing1, ing2, ing3],
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('recipeHistory', JSON.stringify(history.slice(0, 10)));
    displayHistory();
}

// Display history
function displayHistory() {
    const history = JSON.parse(localStorage.getItem('recipeHistory') || '[]');
    const historySection = document.getElementById('historySection');
    const historyList = document.getElementById('historyList');
    
    if (history.length === 0) {
        historySection.classList.add('hidden');
        return;
    }
    
    historySection.classList.remove('hidden');
    historyList.innerHTML = '';
    
    history.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.onclick = () => displayRecipe(item.recipe);
        
        const title = document.createElement('div');
        title.className = 'history-item-title';
        title.textContent = item.recipe.title;
        
        const date = document.createElement('div');
        date.className = 'history-item-date';
        const dateObj = new Date(item.timestamp);
        date.textContent = `${item.ingredients.join(', ')} - ${dateObj.toLocaleDateString('ja-JP')} ${dateObj.toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'})}`;
        
        historyItem.appendChild(title);
        historyItem.appendChild(date);
        historyList.appendChild(historyItem);
    });
}

// Print recipe
function printRecipe() {
    window.print();
}

// Save recipe
function saveRecipe() {
    const recipeTitle = document.getElementById('recipeTitle').textContent;
    alert(`「${recipeTitle}」を保存しました！`);
}

// Share recipe
function shareRecipe() {
    const recipeTitle = document.getElementById('recipeTitle').textContent;
    
    if (navigator.share) {
        navigator.share({
            title: recipeTitle,
            text: `このレシピをチェック: ${recipeTitle}`,
            url: window.location.href
        }).catch(err => console.log('Share error:', err));
    } else {
        alert('このブラウザは共有機能に対応していません。');
    }
}

// Allow submission with Enter key
document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    initTheme();
    
    // Set up theme toggle button
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                generateRecipe();
            }
        });
    });
    
    // Display history on page load
    displayHistory();
});