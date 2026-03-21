import { useState, useEffect } from "react";
import '../home/home.css'

const DateTime = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="date-time">
      <p className="time">{time.toLocaleTimeString()}</p>
      <p>•</p>

      <p className="date">
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
