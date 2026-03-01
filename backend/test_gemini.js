const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyAnXa0VGT3PsV2KjzagX4I0wmpT_ApFzO0");

async function run() {
  console.log("Testing Gemini...");
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Say hi");
    console.log("RESPONSE:", result.response.text());
  } catch (e) {
    console.log("ERROR_STATUS:", e.status);
    console.log("ERROR_MESSAGE:", e.message);
  }
}
run();
