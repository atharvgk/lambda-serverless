from backend.db.database import db
import time
import datetime

# Helper to generate auto-incrementing ID for backward compatibility
def get_next_sequence_value(sequence_name):
    if db is None: return 0
    sequence_doc = db.counters.find_one_and_update(
        {"_id": sequence_name},
        {"$inc": {"sequence_value": 1}},
        upsert=True,
        return_document=True
    )
    return sequence_doc["sequence_value"]

def insert_function(name, language, code, timeout):
    if db is None: return None
    
    # Generate an integer ID to match existing frontend expectations
    new_id = get_next_sequence_value("function_id")
    
    doc = {
        "id": new_id,
        "name": name,
        "language": language,
        "code": code,
        "timeout": timeout,
        "created_at": datetime.datetime.utcnow()
    }
    
    db.functions.insert_one(doc)
    return new_id

def get_all_functions():
    if db is None: return []
    cursor = db.functions.find({}, {"_id": 0, "id": 1, "name": 1, "language": 1, "code": 1, "timeout": 1})
    
    # Format as list of tuples/lists to match previous SQLite return format
    # (id, name, language, code, timeout)
    functions = []
    for doc in cursor:
        functions.append((
            doc["id"],
            doc["name"],
            doc["language"],
            doc["code"],
            doc["timeout"]
        ))
    return functions

def delete_function_by_id(function_id):
    if db is None: return False
    result = db.functions.delete_one({"id": function_id})
    return result.deleted_count > 0

def update_function_code(function_id, new_code):
    if db is None: return
    db.functions.update_one(
        {"id": function_id},
        {"$set": {"code": new_code}}
    )

def get_function_metadata(function_id):
    if db is None: return None
    doc = db.functions.find_one({"id": function_id}, {"language": 1, "timeout": 1})
    if doc:
        return (doc["language"], doc["timeout"])
    return None

def get_function_code(function_id):
    if db is None: return None
    doc = db.functions.find_one({"id": function_id}, {"code": 1})
    return doc["code"] if doc else None

def log_execution(function_id, exec_time, mem_usage, cpu_percent, status, output=""):
    if db is None: return
    
    doc = {
        "function_id": function_id,
        "exec_time": exec_time,
        "mem_usage": mem_usage,
        "cpu_percent": cpu_percent,
        "status": status,
        "output": output,  # Store the actual output
        "timestamp": datetime.datetime.utcnow()
    }
    db.executions.insert_one(doc)

def get_execution_logs(function_id):
    if db is None: return []
    # Return matched logs in tuple format or dict format expected by frontend
    # Current frontend expects list of tuples: (id, function_id, exec_time, mem, cpu, status, timestamp) 
    # But actually frontend receives JSON list of lists? 
    # Checking frontend: logs.map(l => new Date(l[6])) -> index 6 is timestamp.
    # index 2 is time, 4 is cpu.
    
    # Let's verify route.py: it returns `logs`.
    # Let's match the old SQL tuple structure:
    # (id, function_id, exec_time, mem_usage, cpu_percent, status, timestamp)
    
    cursor = db.executions.find({"function_id": function_id}).sort("timestamp", -1).limit(50)
    logs = []
    for doc in cursor:
        logs.append((
            str(doc.get("_id")), 
            doc["function_id"],
            doc["exec_time"],
            doc.get("output", ""), # Index 3: Output
            doc["mem_usage"],      # Index 4: Memory
            doc["status"],         # Index 5: Status
            doc["timestamp"].isoformat() # Index 6: Timestamp
        ))
    return logs

def get_aggregated_metrics(function_id):
    if db is None: return None
    
    pipeline = [
        {"$match": {"function_id": function_id, "status": "success"}},
        {"$group": {
            "_id": None,
            "total_runs": {"$sum": 1},
            "avg_exec_time": {"$avg": "$exec_time"},
            "avg_cpu_percent": {"$avg": "$cpu_percent"},
            "avg_memory_usage": {"$avg": "$mem_usage"},
            "last_run_time": {"$max": "$timestamp"}
        }}
    ]
    
    result = list(db.executions.aggregate(pipeline))
    
    if not result:
        return None
        
    metrics = result[0]
    return {
        "total_runs": metrics["total_runs"],
        "avg_exec_time": round(metrics["avg_exec_time"], 4),
        "avg_cpu_percent": round(metrics["avg_cpu_percent"], 2),
        "avg_memory_usage": round(metrics["avg_memory_usage"], 2),
        "last_run_time": metrics["last_run_time"].isoformat() if metrics["last_run_time"] else None
    }