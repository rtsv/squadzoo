import { useRef, useEffect, useState } from "react";
import styles from "../../styles/DrawGuess.module.css";
import btnStyles from "../../styles/Button.module.css";

function DrawingCanvas({ isDrawer }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
  }, [color, lineWidth]);

  function startDraw(e) {
    if (!isDrawer) return;
    drawing.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  function endDraw() {
    drawing.current = false;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
  }

  function draw(e) {
    if (!drawing.current || !isDrawer) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  const colors = [
    "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", 
    "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080",
    "#FFC0CB", "#A52A2A", "#808080"
  ];

  return (
    <div className={styles.canvasWrapper}>
      {isDrawer && (
        <div className={styles.drawingTools}>
          <div className={styles.toolSection}>
            <label className={styles.toolLabel}>Colors:</label>
            <div className={styles.colorPalette}>
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`${styles.colorBtn} ${color === c ? styles.colorBtnActive : ""}`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
          
          <div className={styles.toolSection}>
            <label className={styles.toolLabel}>Brush:</label>
            <div className={styles.brushSizes}>
              {[2, 4, 6, 8, 10].map((size) => (
                <button
                  key={size}
                  onClick={() => setLineWidth(size)}
                  className={`${btnStyles.btn} ${btnStyles.btnSmall} ${
                    lineWidth === size ? btnStyles.btnPrimary : btnStyles.btnSecondary
                  }`}
                >
                  {size}px
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={clearCanvas}
            className={`${btnStyles.btn} ${btnStyles.btnDanger}`}
          >
            🗑️ Clear
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={600}
        height={320}
        className={styles.canvas}
        onMouseDown={startDraw}
        onMouseUp={endDraw}
        onMouseMove={draw}
        onMouseLeave={endDraw}
      />
    </div>
  );
}

export default DrawingCanvas;
