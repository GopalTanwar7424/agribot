import google.genai as genai

# Your Gemini API key
GEMINI_API_KEY = "AIzaSyA-fX3zbq-XW7UxqRJVlomST8wna0AKneU"  # Replace with your actual key

client = genai.Client(api_key=GEMINI_API_KEY)

print("=" * 60)
print("AVAILABLE GEMINI MODELS")
print("=" * 60)

try:
    models = client.models.list()
    
    vision_models = []
    text_models = []
    
    for model in models:
        model_name = model.name
        
        # Check capabilities
        supports_vision = any('vision' in str(cap).lower() or 'image' in str(cap).lower() 
                             for cap in getattr(model, 'supported_generation_methods', []))
        
        if 'vision' in model_name.lower() or supports_vision:
            vision_models.append(model_name)
        else:
            text_models.append(model_name)
    
    print("\n🖼️  VISION MODELS (Can see images):")
    print("-" * 60)
    if vision_models:
        for model in vision_models:
            print(f"  ✓ {model}")
    else:
        print("  ⚠️  No explicit vision models, but these support images:")
        # List all models that support generateContent
        for model in models[:5]:
            print(f"  - {model.name}")
    
    print("\n📝 ALL MODELS:")
    print("-" * 60)
    for model in models[:10]:
        print(f"  - {model.name}")
        methods = getattr(model, 'supported_generation_methods', [])
        if methods:
            print(f"    Methods: {methods}")
    
    print("\n" + "=" * 60)
    print(f"Total models: {len(list(models))}")
    print("=" * 60)
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    print(traceback.format_exc())