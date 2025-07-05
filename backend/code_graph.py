

dependency_graph = {}  # mapping target cell id to set of source cell ids
arrows = {}  # mapping arrow id to {start, end}

def get_dependencies(cell_id: str) -> set[str]:
    print(f'looking up {cell_id} in {dependency_graph} : {cell_id in dependency_graph}')
    return dependency_graph.get(cell_id, set())

def get_dependents(cell_id: str) -> list[str]:
    return [target for target, sources in dependency_graph.items() if cell_id in sources]

def update_graph(data: dict):
    action = data.get("action")
    arrow_id = data.get("id")
    start = data.get("start")
    end = data.get("end")
    if action == "create":
        arrows[arrow_id] = {"start": start, "end": end}
        if start and end:
            dependency_graph.setdefault(end, set()).add(start)
    elif action == "update":
        old = arrows.get(arrow_id)
        if old and old.get("start") and old.get("end"):
            dependency_graph.get(old["end"], set()).discard(old["start"])
        arrows[arrow_id] = {"start": start, "end": end}
        if start and end:
            dependency_graph.setdefault(end, set()).add(start)
    elif action == "delete":
        old = arrows.pop(arrow_id, None)
        if old and old.get("start") and old.get("end"):
            dependency_graph.get(old["end"], set()).discard(old["start"])
    print("Updated dependency graph:", dependency_graph)
