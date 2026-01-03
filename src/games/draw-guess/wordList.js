const wordsByDifficulty = {
  easy: [
    "apple", "sun", "cat", "dog", "tree", "house", "car", "book",
    "ball", "cup", "star", "moon", "fish", "bird", "flower"
  ],
  medium: [
    "train", "bridge", "guitar", "computer", "river", "school",
    "planet", "mountain", "rainbow", "elephant", "butterfly", "umbrella",
    "telescope", "lighthouse", "waterfall", "volcano"
  ],
  hard: [
    "astronaut", "microscope", "pyramid", "tornado", "orchestra",
    "skyscraper", "submarine", "laboratory", "chandelier", "cathedral",
    "helicopter", "windmill", "rollercoaster", "parachute", "constellation"
  ]
};

const words = [...wordsByDifficulty.easy, ...wordsByDifficulty.medium, ...wordsByDifficulty.hard];

export { wordsByDifficulty };
export default words;
