from flask import Flask, request, jsonify
import subprocess
import os
from livereload import Server
from generate_code import generate_code
from execute_code import execute_code, get_last_result
from code_graph import update_graph, get_dependencies

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='')
sandbox_contexts = {}

cell_outputs = {}  # mapping cell id to output variable name

@app.route('/execute', methods=['POST'])
def execute():
    # Retrieve the Python code and cell id from the request JSON
    code = request.json.get('code', '')
    cell_id = request.json.get('cellId', 'default')
    # Gather context from upstream dependencies
    dependencies = get_dependencies(cell_id)
    prev_outputs = {dep: cell_outputs.get(dep, None) for dep in dependencies}
    # Inject a comment with previous cell outputs into the code
    modified_code = "# previous cell outputs: " + str(prev_outputs) + "\n" + code
    try:
        output = execute_code(cell_id, modified_code)
        # After execution, retrieve the last result from the cell's context
        last_result = sandbox_contexts.get(cell_id, {}).get("__last_result__")
        cell_outputs[cell_id] = last_result
        return jsonify({'output': output}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/generate', methods=['POST'])
def generate():
    description = request.json.get('description', '')
    cell_id = request.json.get('cellId', None)
    print(f'cellId is {cell_id}')
    if cell_id:
        # Find cells that immediately depend on the current cell
        dependents = get_dependencies(cell_id)
        print(f'dependents of {cell_id} are {dependents}')
        # Build variable bindings for dependent cell outputs so they can be used
        bindings = ""
        for dep in dependents:
            value = get_last_result(dep)
            try:
                import pandas as pd
                if isinstance(value, pd.DataFrame):
                    simplified = value.head().to_string()
                else:
                    simplified = repr(value)
            except ImportError:
                simplified = repr(value)
            bindings += f"out_{dep} = {simplified}\n"
        description = bindings + "\n" + description
    try:
        print(f'description is {description}')
        code = generate_code(description)
        return jsonify({ 'code': code }), 200
    except Exception as e:
        return jsonify({ 'error': str(e) }), 400

@app.route('/api/arrow', methods=['POST'])
def arrow_api():
    data = request.get_json()
    print("Received arrow API call:", data)
    update_graph(data)
    return jsonify({"status": "ok"}), 200

@app.route('/')
def serve_index():
    return app.send_static_file('index.html')

if __name__ == '__main__':
    # Build the frontend typescript project if package.json exists
    frontend_dir = os.path.join(os.path.dirname(__file__), '../frontend')
    package_json_path = os.path.join(frontend_dir, 'package.json')
    if os.path.exists(package_json_path):
        subprocess.run(["npm", "install"], cwd=frontend_dir, check=True)
        subprocess.run(["npm", "run", "build"], cwd=frontend_dir, check=True)
    else:
        print("frontend/package.json not found, skipping build")
    server = Server(app.wsgi_app)
    def compile_typescript():
        frontend_dir = os.path.join(os.path.dirname(__file__), '../frontend')
        print("Compiling TypeScript...")
        subprocess.run(["npm", "run", "build"], cwd=frontend_dir, check=True)
    # Watch the frontend TypeScript files and trigger compilation on changes
    server.watch('../frontend/src/', compile_typescript, delay=1)
    # Watch the public folder for changes after compilation
    server.watch('../frontend/dist/', delay=1)
    server.serve(port=5001, debug=True)
