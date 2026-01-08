from flask import Flask, render_template, request, redirect, url_for

app = Flask(__name__)

# --- ROUTES (Navigation) ---

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/marketing')
def marketing():
    return render_template('marketing.html')

@app.route('/tech')
def tech():
    return render_template('tech.html')

@app.route('/futuretech')
def futuretech():
    return render_template('futuretech.html')

@app.route('/about')
def about():
    return render_template('about.html')

# --- CONTACT FORM LOGIC (The "Backend" Power) ---
@app.route('/submit-form', methods=['POST'])
def submit_form():
    if request.method == 'POST':
        # This gets the data from the form inputs
        name = request.form.get('name')
        email = request.form.get('email')
        message = request.form.get('message')
        
        # HERE IS WHERE YOU WOULD ADD CODE TO:
        # 1. Send an email to yourself
        # 2. Save to a database
        
        print(f"New Message from {name}: {message}") # This prints to your terminal
        
        # After submit, go back to home (or a thank you page)
        return redirect(url_for('home'))

if __name__ == '__main__':
    app.run(debug=True, port=5555, host='0.0.0.0')