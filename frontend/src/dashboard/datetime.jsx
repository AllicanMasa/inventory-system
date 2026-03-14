import { useState, useEffect } from "react";

const DateTime = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        textAlign: "center",
        margin: 0,
        padding: 0,
      }}
    >
      <h2>{time.toLocaleTimeString()}</h2>

      <p
        style={{
          fontSize: "1.5rem",
          marginTop: "-2rem",
        }}
      >
        {time.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
    </div>
  );
};

export default DateTime;
