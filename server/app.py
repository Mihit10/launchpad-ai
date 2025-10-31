# app.py  -- final LaunchPad AI backend (copy/paste)
# Requirements:
#   pip install flask firebase-admin google-generativeai flask-cors python-dotenv
#
# Environment:
#   - firebase_credentials.json (service account) in project root
#   - .env with GEMINI_API_KEY and optionally FIREBASE_WEB_API_KEY (for Postman sign-in)
#   - export GEMINI_API_KEY or use .env

import json
from flask import Flask, request, jsonify
from functools import wraps
import firebase_admin
from firebase_admin import credentials, auth, firestore
import google.generativeai as genai
from flask_cors import CORS
from dotenv import load_dotenv
import os
import uuid
from datetime import datetime

# ------------------- Load env and Flask Setup -------------------
load_dotenv()
app = Flask(__name__)
CORS(app)  # dev: allow all; tighten in production
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# ------------------- Firebase Setup -------------------
cred = credentials.Certificate("firebase_credentials.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# ------------------- Gemini / Google GenAI Setup -------------------
# You set GEMINI_API_KEY in .env as GEMINI_API_KEY="..."
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY env var not set. Put it in .env or export it.")

# Configure the library
genai.configure(api_key=GEMINI_API_KEY)

# Try to create a client object if available in the installed SDK version.
# The user earlier mentioned usage: client.models.generate_content(model='gemini-2.5-flash', contents=prompt_text)
# We attempt that pattern and otherwise fall back to older call patterns.
try:
    client = genai.Client()  # will succeed if your google-generativeai version exposes Client()
except Exception:
    client = None

# ------------------- Authentication Decorator -------------------
def verify_firebase_token(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Bearer "):
                raise ValueError("Authorization header missing or malformed")
            token = auth_header.split("Bearer ")[1]
            decoded_token = auth.verify_id_token(token)
            request.user = decoded_token  # contains uid, email, etc.
            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({"error": "Unauthorized", "details": str(e)}), 401
    return wrapper

# ------------------- Helper: call Gemini (robust parsing) -------------------
def call_gemini(prompt_text, model_name="gemini-2.0-flash-lite"):
    """
    Calls Gemini model using the latest Google Generative AI SDK.
    Compatible with 'gemini-2.0-flash-lite' or 'gemini-1.5-pro'.
    Returns clean text output or formatted error.
    """
    try:
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt_text)

        # Extract text depending on SDK version
        if hasattr(response, "text"):
            return response.text.strip()
        elif hasattr(response, "candidates"):
            # Combine candidate texts if multiple
            texts = []
            for c in response.candidates:
                if hasattr(c, "content") and hasattr(c.content, "parts"):
                    texts.extend([p.text for p in c.content.parts if hasattr(p, "text")])
            return "\n".join(texts)
        else:
            return str(response)
    except Exception as e:
        print("Gemini API error:", e)
        return f"Error (Gemini): {e}"


# ------------------- Helper: Update Project Output -------------------
def _update_project_output(projectID, category, output, save=False):
    """
    Writes lastOutputs.<category> = output
    If save True, append to savedOutputs (keeps as array).
    """
    proj_ref = db.collection("projects").document(projectID)
    # ensure doc exists
    doc = proj_ref.get()
    if not doc.exists:
        raise ValueError("Project not found")
    # update lastOutputs
    proj_ref.update({f"lastOutputs.{category}": output})
    # append to savedOutputs if requested
    if save:
        savedAt = datetime.utcnow().isoformat()
        proj_ref.update({"savedOutputs": firestore.ArrayUnion([{"type": category, "content": output, "savedAt": savedAt}])})

# ------------------- USER ROUTES -------------------
@app.route("/user/signup", methods=["POST"])
def signup():
    """
    Creates Firebase Auth user using Admin SDK and a Firestore user doc.
    Body: { "name", "email", "password" }
    """
    data = request.json or {}
    try:
        user = auth.create_user(email=data["email"], password=data["password"], display_name=data.get("name", ""))
        db.collection("users").document(user.uid).set({
            "userID": user.uid,
            "name": data.get("name", ""),
            "email": data["email"],
            "projects": []
        })
        return jsonify({"message": "User created", "userID": user.uid}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/user/<userID>", methods=["GET"])
@verify_firebase_token
def get_user(userID):
    """Return user profile document (Firestore)."""
    user_doc = db.collection("users").document(userID).get()
    if user_doc.exists:
        return jsonify(user_doc.to_dict())
    else:
        return jsonify({"error": "User not found"}), 404

# ------------------- PROJECT ROUTES -------------------
@app.route("/project/create", methods=["POST"])
@verify_firebase_token
def create_project():
    """
    Create a project & add projectID to current user's user doc
    Body: { "projectName": "..." }
    """
    data = request.json or {}
    project_ref = db.collection("projects").document()
    project_obj = {
        "projectID": project_ref.id,
        "projectName": data.get("projectName", "Untitled Project"),
        "status": data.get("status", "new"),
        "timeline": data.get("timeline", ""),
        "dashboard": data.get("dashboard", {}),
        "assistantsUsed": [],
        "lastOutputs": {},
        "savedOutputs": [],
        # helpful fields for dashboard/progress
        "milestones": [],
        "achievements": []
    }
    project_ref.set(project_obj)
    # Add to user projects list
    user_ref = db.collection("users").document(request.user["uid"])
    user_ref.update({"projects": firestore.ArrayUnion([project_ref.id])})
    return jsonify({"message": "Project created", "projectID": project_ref.id}), 201

@app.route("/project/<projectID>", methods=["GET"])
@verify_firebase_token
def get_project(projectID):
    doc = db.collection("projects").document(projectID).get()
    if doc.exists:
        return jsonify(doc.to_dict())
    return jsonify({"error": "Project not found"}), 404

@app.route("/project/<projectID>/update", methods=["PUT"])
@verify_firebase_token
def update_project(projectID):
    data = request.json or {}
    db.collection("projects").document(projectID).update(data)
    return jsonify({"message": "Project updated"}), 200

@app.route("/project/<projectID>/delete", methods=["DELETE"])
@verify_firebase_token
def delete_project(projectID):
    # Remove project doc and remove from user's 'projects' array if exists
    proj_ref = db.collection("projects").document(projectID)
    proj_ref.delete()
    # attempt to remove from current user's list (safe no-op if not present)
    user_ref = db.collection("users").document(request.user["uid"])
    user_ref.update({"projects": firestore.ArrayRemove([projectID])})
    return jsonify({"message": "Project deleted"}), 200

# ------------------- DASHBOARD ROUTES -------------------
@app.route("/dashboard/viewProjects", methods=["GET"])
@verify_firebase_token
def dashboard_view_projects():
    """
    Returns all projects for the authenticated user (reads user doc -> project IDs -> fetches docs)
    """
    user_doc = db.collection("users").document(request.user["uid"]).get()
    if not user_doc.exists:
        return jsonify({"error": "User not found"}), 404
    projects = user_doc.to_dict().get("projects", [])
    result = []
    for pid in projects:
        pdoc = db.collection("projects").document(pid).get()
        if pdoc.exists:
            d = pdoc.to_dict()
            # minimal fields to populate dashboard
            result.append({
                "projectID": d.get("projectID"),
                "projectName": d.get("projectName"),
                "status": d.get("status"),
                "timeline": d.get("timeline"),
                "lastOutputs": d.get("lastOutputs"),
                "savedOutputs": d.get("savedOutputs")
            })
    return jsonify({"projects": result})

@app.route("/dashboard/<projectID>/trackProgress", methods=["GET"])
@verify_firebase_token
def dashboard_track_progress(projectID):
    """
    Returns progress-specific fields (timeline, milestones, achievements) from project.
    """
    d = db.collection("projects").document(projectID).get()
    if not d.exists:
        return jsonify({"error": "Project not found"}), 404
    data = d.to_dict()
    progress = {
        "timeline": data.get("timeline"),
        "milestones": data.get("milestones", []),
        "achievements": data.get("achievements", []),
        "lastOutputs": data.get("lastOutputs", {})
    }
    return jsonify(progress)

# ------------------- BRANDING ASSISTANT -------------------
@app.route("/assistant/branding/generateName", methods=["POST"])
@verify_firebase_token
def branding_generate_name():
    data = request.json or {}
    prompt = (
        f"Suggest 10 creative, unique, and brandable startup names for the idea:\n\n{data.get('idea','')}\n\n"
        "Give short 1–2 word names, followed by a one-line reason for each."
    )
    output = call_gemini(prompt)
    _update_project_output(data["projectID"], "branding", output, data.get("save", False))
    return jsonify({"brandingNames": output})

@app.route("/assistant/branding/createTagline", methods=["POST"])
@verify_firebase_token
def branding_tagline():
    data = request.json or {}
    prompt = (
        f"Generate 5 catchy, professional taglines for this startup idea:\n\n{data.get('idea','')}\n\n"
        "Keep them short (6-10 words) and highlight the value proposition."
    )
    output = call_gemini(prompt)
    _update_project_output(data["projectID"], "branding", output, data.get("save", False))
    return jsonify({"taglines": output})

@app.route("/assistant/branding/generateContent", methods=["POST"])
@verify_firebase_token
def branding_content():
    data = request.json or {}
    prompt = (
        f"Write a short marketing paragraph (approx 80-120 words) for the startup idea:\n\n{data.get('idea','')}\n\n"
        "Tone: professional and friendly. Include target audience and one call-to-action."
    )
    output = call_gemini(prompt)
    _update_project_output(data["projectID"], "branding", output, data.get("save", False))
    return jsonify({"content": output})

@app.route("/assistant/branding/suggestColors", methods=["POST"])
@verify_firebase_token
def branding_suggest_colors():
    """
    Suggest color palette (hex codes + usage). Body: { idea, style(optional), projectID, save(optional) }
    """
    data = request.json or {}
    style = data.get("style", "modern and trustworthy")
    prompt = (
        f"Based on this startup idea:\n\n{data.get('idea','')}\n\n"
        f"Suggest a 4-color palette with HEX codes and brief usage notes (primary, secondary, accent, neutral). Style: {style}."
    )
    output = call_gemini(prompt)
    _update_project_output(data["projectID"], "branding", output, data.get("save", False))
    return jsonify({"colors": output})

# ------------------- LEGAL ASSISTANT -------------------
@app.route("/assistant/legal/simplifyDocument", methods=["POST"])
@verify_firebase_token
def legal_simplify():
    data = request.json or {}
    prompt = f"Simplify the following legal text into plain English while preserving legal meaning:\n\n{data.get('text','')}"
    output = call_gemini(prompt)
    _update_project_output(data["projectID"], "legal", output, data.get("save", False))
    return jsonify({"simplifiedDoc": output})

@app.route("/assistant/legal/suggestStructure", methods=["POST"])
@verify_firebase_token
def legal_structure():
    data = request.json or {}
    prompt = (
        f"Suggest the most suitable business legal structures (e.g., LLC, Pvt Ltd, Partnership) for the startup idea:\n\n"
        f"{data.get('idea','')}\n\nList pros/cons and recommended next steps for each structure."
    )
    output = call_gemini(prompt)
    _update_project_output(data["projectID"], "legal", output, data.get("save", False))
    return jsonify({"legalStructure": output})

# ------------------- MOTIVATION HUB -------------------
@app.route("/assistant/motivation/showEncouragement", methods=["GET"])
@verify_firebase_token
def motivation_encouragement():
    prompt = "Give motivational advice and a short daily routine for a solo founder struggling to stay consistent."
    output = call_gemini(prompt)
    return jsonify({"encouragement": output})

@app.route("/assistant/motivation/trackMilestone", methods=["POST"])
@verify_firebase_token
def motivation_track_milestone():
    """
    Save a milestone to the project's milestones array.
    Body: { projectID, milestoneName, dueDate (optional), status (optional), notes (optional) }
    """
    data = request.json or {}
    projectID = data.get("projectID")
    if not projectID:
        return jsonify({"error": "projectID missing"}), 400
    milestone = {
        "milestoneID": str(uuid.uuid4()),
        "name": data.get("milestoneName"),
        "dueDate": data.get("dueDate"),
        "status": data.get("status", "pending"),
        "notes": data.get("notes", ""),
        "createdBy": request.user["uid"]
    }
    db.collection("projects").document(projectID).update({"milestones": firestore.ArrayUnion([milestone])})
    return jsonify({"message": "Milestone tracked", "milestone": milestone}), 201

@app.route("/assistant/motivation/achievement", methods=["POST"])
@verify_firebase_token
def motivation_achievement():
    """
    Record an achievement and optionally generate celebration text via Gemini.
    Body: { projectID, achievementText, celebrate (bool, optional), save (bool) }
    """
    data = request.json or {}
    projectID = data.get("projectID")
    if not projectID or not data.get("achievementText"):
        return jsonify({"error": "projectID and achievementText required"}), 400

    achievement = {
        "achievementID": str(uuid.uuid4()),
        "text": data["achievementText"],
        "createdBy": request.user["uid"]
    }
    # store in project's achievements
    db.collection("projects").document(projectID).update({"achievements": firestore.ArrayUnion([achievement])})

    response_text = ""
    if data.get("celebrate", False):
        prompt = f"Write a short celebratory message for this achievement:\n\n{data['achievementText']}\n\nKeep it upbeat and <50 words."
        response_text = call_gemini(prompt)
        # if requested, save the celebration text to savedOutputs
        if data.get("save", False):
            db.collection("projects").document(projectID).update({
                "savedOutputs": firestore.ArrayUnion([
                    {
                        "type": "achievement_celebration",
                        "content": response_text,
                        "savedAt": datetime.utcnow().isoformat()
                    }
                ])
            })

    return jsonify({"message": "Achievement recorded", "achievement": achievement, "celebration": response_text})

@app.route("/assistant/motivation/successStories", methods=["GET"])
@verify_firebase_token
def motivation_success_stories():
    """
    Generate or fetch success stories for inspiration.
    Query params: projectID (optional)
    If projectID provided, uses project's savedOutputs + achievements to craft a short success story.
    """
    projectID = request.args.get("projectID")
    if projectID:
        pdoc = db.collection("projects").document(projectID).get()
        if not pdoc.exists:
            return jsonify({"error": "Project not found"}), 404
        pdata = pdoc.to_dict()
        # build prompt with key fields
        prompt = (
            "Using the following project data, write a short success-story-style summary (200-300 words) that a founder can read for motivation:\n\n"
            f"Project name: {pdata.get('projectName')}\n"
            f"Achievements: {pdata.get('achievements', [])}\n"
            f"Recent outputs: {pdata.get('lastOutputs', {})}\n\n"
            "Make it inspiring and realistic."
        )
    else:
        prompt = "Write three short startup success stories (150-250 words each) about small teams that made a product-market fit and grew sustainably."

    output = call_gemini(prompt)
    return jsonify({"successStories": output})

# ------------------- IDEATION SUITE -------------------
@app.route("/assistant/ideation/generateIdea", methods=["POST"])
@verify_firebase_token
def ideation_generate():
    data = request.json or {}
    input_data = {}
    print(request.json)

    try:
        # Parse structured input from whiteboard or direct parameters
        if data.get('topic'):
            input_data = json.loads(data['topic'])
        else:
            input_data = data
            
        # Build a comprehensive prompt based on input
        prompt = "Generate a detailed startup idea based on the following parameters:\n\n"
        
        if 'Name' in input_data:
            prompt += f"Concept Name: {input_data['Name'][0] if isinstance(input_data['Name'], list) else input_data['Name']}\n"
            
        if 'Feature' in input_data:
            features = input_data['Feature'] if isinstance(input_data['Feature'], list) else [input_data['Feature']]
            prompt += "Key Features:\n" + "\n".join([f"- {f}" for f in features]) + "\n\n"
            
        if 'Context' in input_data:
            context = input_data['Context'] if isinstance(input_data['Context'], list) else [input_data['Context']]
            prompt += "Context/Background:\n" + "\n".join([f"- {c}" for c in context]) + "\n\n"
            
        if 'Target Audience' in input_data:
            audience = input_data['Target Audience'] if isinstance(input_data['Target Audience'], list) else [input_data['Target Audience']]
            prompt += "Target Audience:\n" + "\n".join([f"- {a}" for a in audience]) + "\n\n"
        
        prompt += """
Please provide a detailed analysis with the following structure:
1. Business Summary: A clear, concise description of the business concept
2. Value Proposition: What unique value does this offer?
3. Market Opportunity: Why is this needed now?
4. Technical Feasibility: Initial assessment of development complexity
5. Target Demographics: Detailed breakdown of potential users/customers
6. Potential Challenges: Key obstacles to consider
7. Next Steps: Immediate actions to validate and develop this idea
Provide the response in well-organized sections with headings.
keep the content clear and consise and avoid jargons.
leave a line after each section."""

        output = call_gemini(prompt)
        
        # Create structured response
        response = {
            "generated": {
                "name": input_data.get('Name', ['Unnamed Idea'])[0] if isinstance(input_data.get('Name'), list) else input_data.get('Name', 'Unnamed Idea'),
                "description": output,
                "analysis": {
                    "createdAt": datetime.utcnow().isoformat(),
                    "type": "generated"
                }
            }
        }

        
        # Save if requested
        if data.get('save', False):
            _update_project_output(data["projectID"], "ideation", response["generated"], True)
            
        return jsonify(response)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/assistant/ideation/validateIdea", methods=["POST"])
@verify_firebase_token
def ideation_validate():
    data = request.json or {}
    try:
        idea = json.loads(data['idea']) if isinstance(data.get('idea'), str) else data.get('idea', {})
        
        prompt = f"""
Analyze the following startup idea in detail:

Name: {idea.get('name', 'Unnamed Idea')}
Description: {idea.get('description', 'No description provided')}

Please provide a comprehensive validation analysis with the following sections:

1. Market Analysis
   - Market size and potential
   - Current market trends
   - Competition analysis
   - Market entry barriers

2. Business Model Validation
   - Revenue potential
   - Cost structure analysis
   - Scalability assessment
   - Business model viability score (1-10)

3. Technical Feasibility
   - Implementation complexity
   - Resource requirements
   - Technical risks
   - Technology readiness score (1-10)

4. Risk Assessment
   - Key business risks
   - Mitigation strategies
   - Critical success factors
   - Overall risk score (1-10)

5. Recommendations
   - Key strengths to leverage
   - Areas needing improvement
   - Immediate next steps
   - Long-term considerations

For each section, provide clear, actionable insights and specific recommendations.
"""
        
        output = call_gemini(prompt)
        
        # Create structured response
        validation_result = {
            "ideaName": idea.get('name', 'Unnamed Idea'),
            "validationReport": output,
            "timestamp": datetime.utcnow().isoformat(),
            "type": "validation"
        }

        
        if data.get('save', False):
            _update_project_output(data["projectID"], "ideation_validation", validation_result, True)
            
        return jsonify({"validation": validation_result})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/assistant/ideation/generateRoadmap", methods=["POST"])
@verify_firebase_token
def ideation_generate_roadmap():
    data = request.json or {}
    try:
        ideas = data.get('ideas', [])
        params = data.get('params', {})
        
        prompt = f"""
You are a startup strategy and product management expert.

Your task is to design a **complete, actionable roadmap** for the following startup idea(s):

Startup Idea(s):
{chr(10).join([f"- {idea.get('name', 'Unnamed')}: {idea.get('description', 'No description')}" for idea in ideas])}

Project Timeline: {params.get('timeline', '6 months')}
Key Goals: {params.get('goals', 'No specific goals provided')}
Current Challenges: {params.get('weakness', 'No challenges specified')}

---

### Your Output Objective:
Generate a structured roadmap in **valid JSON only** (no markdown, no commentary).  
You must intelligently determine the **number of phases** based on:
- The overall timeline (3 / 6 / 12 months)
- The startup’s complexity and goals
- Logical dependency of activities (foundation → development → launch → growth)
- Reasonable time allocation per phase

If a startup needs many steps, you may create **more phases with smaller durations** (e.g., 5–6 phases for a 3-month project).  
If it’s a longer or complex project, you may use **fewer, broader phases** (e.g., 8–10 for 12 months).

---

### **JSON Format (strictly follow this)**
Output must be strictly valid JSON in this structure:

{{
  "steps": [
    {{
      "name": "Phase 1: Research and Ideation",
      "description": "Conduct market research, define user personas, validate key assumptions, and refine the MVP concept.",
      "timeframe": "Weeks 1–2"
    }},
    {{
      "name": "Phase 2: MVP Development",
      "description": "Develop core product features, set up backend, and integrate minimal viable functionalities.",
      "timeframe": "Weeks 3–6"
    }},
    {{
      "name": "Phase 3: Launch & Feedback Loop",
      "description": "Launch MVP publicly, gather feedback, iterate on key issues, and track product-market fit indicators.",
      "timeframe": "Weeks 7–12"
    }}
  ]
}}

---

### **Rules:**
1. Always output **only valid JSON**, starting with `{{` and ending with `}}`.
2. Each phase should have:
   - A clear actionable **name**
   - A detailed **description**
   - A realistic **timeframe** (in weeks or months depending on the duration)
3. Ensure **total timeframe aligns with** the given overall timeline (e.g., all steps should cover ~6 months if user selected 6 months).
4. Avoid repetitive or generic step names like "Phase 1", "Phase 2" — make them **meaningful and unique**.
5. Ensure all text is concise and well-written for direct display in a roadmap UI.
"""



        
        output = call_gemini(prompt)
        
        # Create structured response
        roadmap = {
            "ideas": [idea.get('name', 'Unnamed') for idea in ideas],
            "timeline": params.get('timeline'),
            "roadmap": output,
            "createdAt": datetime.utcnow().isoformat(),
            "type": "roadmap"
        }

        
        if data.get('save', False):
            _update_project_output(data["projectID"], "ideation_roadmap", roadmap, True)
            
        return jsonify({"roadmap": roadmap})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# ------------------- DIGITAL WHITEBOARD -------------------
@app.route("/assistant/whiteboard/addNote", methods=["POST"])
@verify_firebase_token
def add_note():
    data = request.json or {}
    projectID = data.get("projectID")
    if not projectID:
        return jsonify({"error": "projectID required"}), 400
    note = {"noteID": str(uuid.uuid4()), "text": data.get("text", ""), "createdBy": request.user["uid"]}
    db.collection("projects").document(projectID).update({"savedOutputs": firestore.ArrayUnion([note])})
    return jsonify({"message": "Note added", "note": note}), 201

@app.route("/assistant/whiteboard/editNote/<noteID>", methods=["PUT"])
@verify_firebase_token
def edit_note(noteID):
    """
    Edit note content. Body: { projectID, text }
    Implementation: fetch savedOutputs array, replace the object with matching noteID, update whole array.
    """
    data = request.json or {}
    projectID = data.get("projectID")
    new_text = data.get("text", "")
    if not projectID:
        return jsonify({"error": "projectID required"}), 400
    proj_ref = db.collection("projects").document(projectID)
    proj_doc = proj_ref.get()
    if not proj_doc.exists:
        return jsonify({"error": "Project not found"}), 404
    saved = proj_doc.to_dict().get("savedOutputs", [])
    updated = []
    found = False
    for item in saved:
        # item might be a dict with 'noteID' or different types; handle gracefully
        if isinstance(item, dict) and item.get("noteID") == noteID:
            new_item = item.copy()
            new_item["text"] = new_text
            new_item["editedAt"] = datetime.utcnow().isoformat()
            updated.append(new_item)
            found = True
        else:
            updated.append(item)
    if not found:
        return jsonify({"error": "Note not found"}), 404
    proj_ref.update({"savedOutputs": updated})
    return jsonify({"message": "Note updated", "noteID": noteID}), 200

@app.route("/assistant/whiteboard/removeNote/<noteID>", methods=["DELETE"])
@verify_firebase_token
def remove_note(noteID):
    """
    Remove note by noteID. Implementation replaces savedOutputs with filtered array (reliable).
    Body JSON: { "projectID": "<projectID>" }
    """
    data = request.json or {}
    projectID = data.get("projectID")
    if not projectID:
        return jsonify({"error": "projectID required"}), 400
    proj_ref = db.collection("projects").document(projectID)
    proj_doc = proj_ref.get()
    if not proj_doc.exists:
        return jsonify({"error": "Project not found"}), 404
    saved = proj_doc.to_dict().get("savedOutputs", [])
    new_saved = [item for item in saved if not (isinstance(item, dict) and item.get("noteID") == noteID)]
    proj_ref.update({"savedOutputs": new_saved})
    return jsonify({"message": f"Note {noteID} removed"}), 200

# ------------------- Run -------------------
if __name__ == "__main__":
    # debug True for development; set False in production
    app.run(host="0.0.0.0", port=5000, debug=True)
