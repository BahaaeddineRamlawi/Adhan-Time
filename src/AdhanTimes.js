import React, { useEffect, useState } from "react";
import "./AdhanTimes.css";

const AdhanTimes = () => {
  const [dateInfo, setDateInfo] = useState(null);
  const [prayerTimes, setPrayerTimes] = useState([]);
  const [nextPrayerIndex, setNextPrayerIndex] = useState(-1);

  useEffect(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    const dateString = `${day}-${month}-${year}`;
    const apiUrl = `https://api.aladhan.com/v1/timings/${dateString}?latitude=33.5731084&longitude=35.3806842&method=2`;

    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => {
        if (data.code === 200 && data.status === "OK") {
          const timings = data.data.timings;
          const hijriDate = data.data.date.hijri;
          const gregorianDate = data.data.date.gregorian;
          const day = data.data.date.readable;

          setDateInfo({
            gregorian: `${gregorianDate.weekday.en} ${day}`,
            hijri: `${hijriDate.day} ${hijriDate.month.en} (${hijriDate.month.ar}) ${hijriDate.year}`,
          });

          const prayers = [
            { name: "Fajr ( الفجر )", time: timings.Fajr },
            { name: "Sunrise ( الشروق )", time: timings.Sunrise },
            { name: "Dhuhr ( الظهر )", time: timings.Dhuhr },
            { name: "Asr ( العصر )", time: timings.Asr },
            { name: "Maghrib ( المغرب )", time: timings.Maghrib },
            { name: "Isha ( العشاء )", time: timings.Isha },
          ];
          setPrayerTimes(prayers);

          highlightNextPrayer(prayers);
        } else {
          console.error("Error fetching data from API");
        }
      })
      .catch((error) => console.error("Error:", error));
  }, []);

  const highlightNextPrayer = (prayers) => {
    const currentTime = new Date();
    let nextPrayerIndex = -1;

    for (let i = 0; i < prayers.length; i++) {
      const [hours, minutes] = prayers[i].time.split(":");
      const prayerTime = new Date();
      prayerTime.setHours(hours, minutes, 0);

      const prayerTimeWithBuffer = new Date(
        prayerTime.getTime() + 15 * 60 * 1000
      );

      if (currentTime >= prayerTime && currentTime <= prayerTimeWithBuffer) {
        nextPrayerIndex = i;
        break;
      }
    }

    setNextPrayerIndex(nextPrayerIndex);
  };

  return (
    <div className="container">
      <div className="corner-circle top-left"></div>
      <div className="corner-circle top-right"></div>
      <div className="corner-circle bottom-left"></div>
      <div className="corner-circle bottom-right"></div>
      <div className="minicontainer">
        <div className="header">
          <h1>Adhan Times in Saida</h1>
        </div>
        {dateInfo && (
          <div className="date">
            <p>Date: {dateInfo.gregorian}</p>
            <p>Hijri Date: {dateInfo.hijri}</p>
          </div>
        )}
        <div className="prayer-times">
          {prayerTimes.map((prayer, index) => (
            <div
              key={prayer.name}
              className={`prayer-time ${
                index === nextPrayerIndex ? "next-prayer" : ""
              }`}
              data-time={prayer.time}
            >
              <h2>{prayer.name}</h2>
              <p>{prayer.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdhanTimes;
