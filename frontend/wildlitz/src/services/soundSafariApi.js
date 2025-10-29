// frontend/wildlitz/src/services/soundSafariApi.js
import { processAnimalImages } from "../utils/imageUtils";
import { API_BASE_URL } from "../config/api";
const PHONEMICS_API = `${API_BASE_URL}/api/phonemics`;

export const fetchSafariAnimals = async (params) => {
  try {
    const queryParams = new URLSearchParams({
      sound: params.sound,
      difficulty: params.difficulty,
      environment: params.environment,
      position: params.position,
    });

    const response = await fetch(`${PHONEMICS_API}/animals/?${queryParams}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Process animal images to ensure correct URLs
    if (data.animals) {
      data.animals = processAnimalImages(data.animals);
    }

    return data;
  } catch (error) {
    console.error("Error fetching safari animals:", error);
    throw error;
  }
};

export const fetchRandomSound = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/random-sound/`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching random sound:", error);
    throw error;
  }
};

export const fetchSoundExamples = async (sound) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/sound-examples/?sound=${sound}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching sound examples:", error);
    throw error;
  }
};

export const submitGameResults = async (results) => {
  try {
    const response = await fetch(`${API_BASE_URL}/submit-results/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(results),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error submitting game results:", error);
    throw error;
  }
};
