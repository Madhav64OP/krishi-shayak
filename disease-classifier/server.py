from fastapi import FastAPI, File, UploadFile
from model_helper import predict
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["https://your-frontend-domain.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/predict")
async def get_prediction(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        image_path ="temp_file.jpg"
        with open(image_path, "wb") as f:
            f.write(image_bytes)

        prediction = predict(image_path)
        return {"prediction": prediction}
    except Exception as e:
        return {"error": str(e)}



