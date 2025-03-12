/**
 * Gmail Add-on: Checks if an email is spam using an ML model and displays a warning.
 */

// Function to create the UI for Gmail Add-on
function getContextualAddOn(e) {
  var card = createSpamCheckCard(e);
  return [card];
}

// Function to create the UI Card
function createSpamCheckCard(e) {
  var message = getCurrentEmailBody(e);

  if (!message) {
    return CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader().setTitle("Spam Filter"))
      .addSection(CardService.newCardSection().addWidget(
        CardService.newTextParagraph().setText("⚠️ No email content found.")
      ))
      .build();
  }

  // Call ML API to classify email
  var spamResponse = checkSpamWithMLModel(message);

  // Show Spam Warning
  var warningText = spamResponse.isSpam ? "🚨 This email has Potential Threat!" : "✅ This email is safe.";

  var card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("Spam Filter Result"))
    .addSection(CardService.newCardSection().addWidget(
      CardService.newTextParagraph().setText(warningText)
    ))
    .build();

  return card;
}

// Function to fetch the currently open email body
function getCurrentEmailBody(e) {
  var accessToken = e.messageMetadata.accessToken;
  var messageId = e.messageMetadata.messageId;
  
  GmailApp.setCurrentMessageAccessToken(accessToken);
  var email = GmailApp.getMessageById(messageId);
  
  return email ? email.getPlainBody() : null;
}

// Function to call the ML model API
// Function to call the Generative AI spam filter model
function checkSpamWithMLModel(emailText) {
  try {
    var apiKey = "AIzaSyBJnE4HIFBI18-K01HlajZQOyNPUc6xvK0"; // Replace with your actual API Key
    var modelName = "tunedModels/spamfilter-uhtynq0ej87q";
    var modelFishLink = "tunedModels/fishlink-k4wxuwywr9g5";
    var modelFishMail = "tunedModels/fishmailfilter-h7jktvmf9ss5"
    
    var requestData = {
      "model": modelName,
      "prompt": emailText,
      "temperature": 1,
      "top_p": 0.95,
      "top_k": 40,
      "max_output_tokens": 8192
    };

    var response = UrlFetchApp.fetch("https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent", {
      method: "post",
      contentType: "application/json",
      headers: {
        "Authorization": "Bearer " + apiKey
      },
      payload: JSON.stringify(requestData)
    });

    var responseFishLink = UrlFetchApp.fetch("https://generativelanguage.googleapis.com/v1beta/models/" + modelFishLink + ":generateContent", {
      method: "post",
      contentType: "application/json",
      headers: {
        "Authorization": "Bearer " + apiKey
      },
      payload: JSON.stringify(requestData)
    });

    var responseFishMail = UrlFetchApp.fetch("https://generativelanguage.googleapis.com/v1beta/models/" + modelFishMail + ":generateContent", {
      method: "post",
      contentType: "application/json",
      headers: {
        "Authorization": "Bearer " + apiKey
      },
      payload: JSON.stringify(requestData)
    });

    var jsonResponse = JSON.parse(response.getContentText());

    // Extract classification result (assuming the model returns "spam" or "ham")
    var predictionSpam = jsonResponse.candidates[0].output.toLowerCase().includes("spam") ? true : false;
    var predictionLink = jsonResponse.candidates[0].output.toLowerCase().includes("1") ? true : false;
    var predictionMail = jsonResponse.candidates[0].output.toLowerCase().includes("1") ? true : false;



    if (predictionSpam) {
      return { isSpam: true, reason: "Spam detected" };
    } else if (predictionLink) {
      return { isSpam: true, reason: "Phishing link detected" };
    } else if (predictionMail) {
      return { isSpam: true, reason: "Fraudulent email detected" };
    }

    
    return { isSpam: false, reason: "Clean email" };

  } catch (error) {
    Logger.log("Error: " + error);
    return { isSpam: false }; // Default to "Not Spam" if API fails
  }
}


// Define manifest file for Gmail Add-on
var manifest = {
  "timeZone": "UTC",
  "dependencies": {
    "enabledAdvancedServices": []
  },
  "oauthScopes": [
    "https://www.googleapis.com/auth/script.external_request",

    "https://www.googleapis.com/auth/gmail.addons.execute",
    "https://www.googleapis.com/auth/gmail.readonly"
  ],
  "gmail": {
    "contextualTriggers": [{
      "unconditional": {},
      "onTriggerFunction": "getContextualAddOn"
    }],
    "logoUrl": "https://your-logo-url.com/logo.png",
    "name": "Spam Checker",
    "version": "1"
  }
};
