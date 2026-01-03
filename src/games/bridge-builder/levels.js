const levels = [
    {
      id: 1,
      name: "Easy Crossing",
      difficulty: "Easy",
      maxBridgesPerPlayer: 3,
      grid: [
        ["L", "L", "R", "L", "L"],
        ["L", "R", "R", "R", "L"],
        ["L", "L", "R", "L", "L"]
      ]
    },
    {
      id: 2,
      name: "Narrow River",
      difficulty: "Medium",
      maxBridgesPerPlayer: 2,
      grid: [
        ["L", "R", "R", "L", "L"],
        ["L", "R", "R", "R", "L"],
        ["L", "L", "R", "R", "L"]
      ]
    },
    {
      id: 3,
      name: "Tricky Path",
      difficulty: "Hard",
      maxBridgesPerPlayer: 1,
      grid: [
        ["L", "R", "R", "R", "L"],
        ["L", "R", "L", "R", "L"],
        ["L", "R", "R", "R", "L"]
      ]
    }
  ];
  
  export default levels;
  