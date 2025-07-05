import contextlib
import io
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import base64
from code_graph import get_dependencies


sandbox_contexts = {}

def get_last_result(cell_id):
    return sandbox_contexts.get(cell_id, {}).get("__last_result__")


def execute_code(cell_id, code):
    if cell_id not in sandbox_contexts:
        sandbox_contexts[cell_id] = {}
    # Merge contexts from dependent cells
    merged_ctx = {}
    for dep in get_dependencies(cell_id):
         merged_ctx.update(sandbox_contexts.get(dep, {}))
    # Add the current cell's own context
    merged_ctx.update(sandbox_contexts[cell_id])
    ctx = merged_ctx
    for dep in get_dependencies(cell_id):
        ctx[f"out_{dep}"] = sandbox_contexts.get(dep, {}).get("__last_result__")
    output = io.StringIO()
    with contextlib.redirect_stdout(output):
        # Split code into lines
        lines = code.rstrip().split('\n')
        if lines:
            try:
                # Try to compile the last line as an expression
                expr = compile(lines[-1], '<string>', 'eval')
                if (len(lines) > 1):
                    exec(compile('\n'.join(lines[:-1]), '<string>', 'exec'), ctx)
                result = eval(expr, ctx)
                ctx["__last_result__"] = result
                if (result is not None):
                    try:
                        import pandas as pd
                        if (isinstance(result, pd.DataFrame)):
                            print(result.to_html(classes='modern-table', border=0))
                        else:
                            print(result)
                    except ImportError:
                        print(result)
            except SyntaxError:
                # If last line is not an expression, execute the entire code
                exec(compile(code, '<string>', 'exec'), ctx)
                ctx["__last_result__"] = None
            # Check for matplotlib figures
            figs = plt.get_fignums()
            for fig_num in figs:
                fig = plt.figure(fig_num)
                buf = io.BytesIO()
                fig.savefig(buf, format='png')
                data = base64.b64encode(buf.getvalue()).decode('utf-8')
                print(f'<img src="data:image/png;base64,{data}" />')
                plt.close(fig)
    sandbox_contexts[cell_id] = ctx.copy()
    return output.getvalue()
