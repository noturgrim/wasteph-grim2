import { useState, useEffect } from "react";

const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const timeUnits = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <div className="flex justify-center gap-6 md:gap-8">
      {timeUnits.map((unit, index) => (
        <div key={unit.label} className="text-center">
          <div className="group relative mb-2 transition-transform duration-300 hover:scale-105">
            <div className="relative">
              {/* Value */}
              <div className="text-4xl font-extrabold tabular-nums text-white md:text-5xl">
                {String(unit.value).padStart(2, "0")}
              </div>

              {/* Subtle underline that appears on hover */}
              <div className="mx-auto mt-1.5 h-px w-0 bg-[#15803d] transition-all duration-300 group-hover:w-full" />
            </div>
          </div>

          {/* Label */}
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">
            {unit.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CountdownTimer;
