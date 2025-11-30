// frontend/wildlitz/src/services/soundSafariApi.js
import { processAnimalImages } from "../utils/imageUtils";
import { API_BASE_URL } from "../config/api";
const PHONEMICS_API = `${API_BASE_URL}/api/phonemics`;
import { isExcludedCombination } from "../utils/excludedCombinations";

export const fetchSafariAnimals = async (params) => {
  try {
    const queryParams = new URLSearchParams({
      sound: params.sound,
      difficulty: params.difficulty,
      environment: params.environment,
      position: params.position,
    });

    // ✅ Pre-validate to prevent excluded combinations
    if (isExcludedCombination(params.sound, params.position)) {
      console.warn(`⚠️ Blocked excluded combination: ${params.sound}-${params.position}`);
      return {
        success: false,
        animals: [],
        excluded: true,
        error: `Combination ${params.sound}-${params.position} is excluded`
      };
    }

    const response = await fetch(`${PHONEMICS_API}/animals/?${queryParams}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // If backend returns excluded combination error, handle gracefully
      if (response.status === 400 && errorData.excluded) {
        console.warn(`⚠️ Backend rejected excluded combination: ${params.sound}-${params.position}`);
        return {
          success: false,
          animals: [],
          excluded: true,
          error: errorData.error
        };
      }
      
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

export const fetchRandomSound = async (position = null) => {
  try {
    // ✅ FIX: Include position parameter to avoid excluded combinations
    const url = position 
      ? `${PHONEMICS_API}/random-sound/?position=${position}`
      : `${PHONEMICS_API}/random-sound/`;
    
    const response = await fetch(url);

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
    // ✅ FIXED: Use PHONEMICS_API instead of API_BASE_URL
    const response = await fetch(
      `${PHONEMICS_API}/sound-examples/?sound=${sound}`
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
    // ✅ FIXED: Use PHONEMICS_API instead of API_BASE_URL
    const response = await fetch(`${PHONEMICS_API}/submit-results/`, {
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