import openai
import os

def sanitize_code(code: str) -> str:
    if code.startswith("```python"):
        code = code[len("```python"):]
    if code.startswith("```"):
        code = code[len("```"):]
    if code.endswith("```"):
        code = code[:-len("```")]
    return code


openai_model = "gpt-4.1-mini"
client = openai.OpenAI(api_key=os.environ['OPENAI_API_KEY'])
system_messages = [
    {"role": "system", "content": "You are generating python code for jupyter notebooks given natural language descriptions. User will submit a natural language input. Respond with only python code that implements the request."}
]

def generate_code(description: str) -> str:
    response = client.chat.completions.create(
        model=openai_model,
        messages=[
            *system_messages,
            {"role": "user", "content": description}
        ]
    )
    code = response.choices[0].message.content
    code = sanitize_code(code)
    return code
