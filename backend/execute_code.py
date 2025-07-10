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

def build_evaluation_ctx(cell_id):
    """Given a cell_id computes the context formed from merging each
    of its dependents."""
    if cell_id not in sandbox_contexts:
        sandbox_contexts[cell_id] = {}
    # Merge contexts from dependent cells
    merged_ctx = {}
    for dep in get_dependencies(cell_id):
         merged_ctx.update(sandbox_contexts.get(dep, {}))
    # Add the current cell's own context
    merged_ctx.update(sandbox_contexts[cell_id])
    return merged_ctx


def evaluate_code_to_result(ctx, lines):
    """Evaluates a sequence of lines corresponding to a python snippet
    to a final result (assuming the last line is an expression)."""
    try:
        # Try to compile the last line as an expression
        expr = compile(lines[-1], '<string>', 'eval')
        if (len(lines) > 1):
            exec(compile('\n'.join(lines[:-1]), '<string>', 'exec'), ctx)
            result = eval(expr, ctx)
        else:
            result = eval(expr, ctx)
        return result
    except SyntaxError:
        # If last line is not an expression, execute the entire code
        exec(compile('\n'.join(lines), '<string>', 'exec'), ctx)
        return None

def pretty_print_evaluation_result(result):
    """Pretty print an arbitrary python value. (Special case handling
    for special values like Pandas Dataframes)"""
    try:
        import pandas as pd
        if (isinstance(result, pd.DataFrame)):
            print(result.to_html(classes='modern-table', border=0))
        else:
            print(result)
    except ImportError:
        print(result)

def pretty_print_figures():
    """Pretty prints all matplot figures in the output as inline-src
    base64-encoded HTML images."""
    # Check for matplotlib figures
    figs = plt.get_fignums()
    for fig_num in figs:
        fig = plt.figure(fig_num)
        buf = io.BytesIO()
        fig.savefig(buf, format='png')
        data = base64.b64encode(buf.getvalue()).decode('utf-8')
        print(f'<img src="data:image/png;base64,{data}" />')
        plt.close(fig)

def execute_code(cell_id, code):
    ctx = build_evaluation_ctx(cell_id)

    # declare dependencies of sandbox contexts
    for dep in get_dependencies(cell_id):
        ctx[f"out_{dep}"] = sandbox_contexts.get(dep, {}).get("__last_result__")

    output = io.StringIO()
    with contextlib.redirect_stdout(output):
        lines = code.rstrip().split('\n')
        if lines:
            # evaluate submitted code
            ctx["__last_result__"] = evaluate_code_to_result(ctx, lines)

            # if produced a result print it
            if (ctx["__last_result__"] is not None):
                pretty_print_evaluation_result(ctx["__last_result__"])

            # also print matplotlib figures 
            pretty_print_figures()

    # keep track of context
    sandbox_contexts[cell_id] = ctx.copy()

    # return the pretty printed outputs from evaluation
    return output.getvalue()
