import json
import os
from aiohttp import web
from server import PromptServer

PRESETS_FILE = os.path.join(os.path.dirname(__file__), "my_lighting_presets.json")

def load_presets():
    if not os.path.exists(PRESETS_FILE):
        return {}
    try:
        with open(PRESETS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def save_presets(presets):
    with open(PRESETS_FILE, "w", encoding="utf-8") as f:
        json.dump(presets, f, indent=2, ensure_ascii=False)

@PromptServer.instance.routes.get("/my_lighting/presets")
async def get_presets(request):
    return web.json_response(load_presets())

@PromptServer.instance.routes.post("/my_lighting/presets")
async def post_preset(request):
    data = await request.json()
    name = data.get("name", "").strip()
    preset = data.get("preset")
    if not name or preset is None:
        return web.json_response({"error": "missing name or preset"}, status=400)
    presets = load_presets()
    presets[name] = preset
    save_presets(presets)
    return web.json_response({"ok": True, "presets": presets})

@PromptServer.instance.routes.delete("/my_lighting/presets")
async def delete_preset(request):
    data = await request.json()
    name = data.get("name", "").strip()
    presets = load_presets()
    if name in presets:
        del presets[name]
        save_presets(presets)
    return web.json_response({"ok": True, "presets": presets})


class My_Lighting:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "lighting_prompt": ("STRING", {"default": "", "multiline": True}),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("lighting_prompt",)
    FUNCTION = "run"
    CATEGORY = "MY NODES"

    def run(self, lighting_prompt=""):
        return (lighting_prompt,)


NODE_CLASS_MAPPINGS = {"My_Lighting": My_Lighting}
NODE_DISPLAY_NAME_MAPPINGS = {"My_Lighting": "My Lighting"}
