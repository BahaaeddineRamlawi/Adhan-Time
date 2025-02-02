import React, { useEffect, useState } from "react";
import "./AdhanTimes.css";

const AdhanTimes = () => {
  const [dateInfo, setDateInfo] = useState(null);
  const [day, setDay] = useState(null);
  const [prayerTimes, setPrayerTimes] = useState([]);
  const [nextPrayerIndex, setNextPrayerIndex] = useState(-1);
  const [showGregorianDate, setShowGregorianDate] = useState(true);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setLocation({ latitude, longitude });
            setLocationError(null);
          },
          (error) => {
            setLocationError(
              "Unable to retrieve your location. Please enable location services."
            );
            console.error("Error retrieving location:", error);
          }
        );
      } else {
        setLocationError("Geolocation is not supported by this browser.");
      }
    };

    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (!location) return;

    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    const dateString = `${day}-${month}-${year}`;
    const apiUrl = `https://api.aladhan.com/v1/timings/${dateString}?latitude=${location.latitude}&longitude=${location.longitude}&method=11`;

    const traditionalMonths = {
      January: "كانون الثاني",
      February: "شباط",
      March: "آذار",
      April: "نيسان",
      May: "أيار",
      June: "حزيران",
      July: "تموز",
      August: "آب",
      September: "أيلول",
      October: "تشرين الأول",
      November: "تشرين الثاني",
      December: "كانون الأول",
    };

    setIsLoading(true);

    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => {
        setIsLoading(false);
        if (data.code === 200 && data.status === "OK") {
          const timings = data.data.timings;
          const hijriDate = data.data.date.hijri;
          const gregorianDate = data.data.date.gregorian;
          setDay(
            `${gregorianDate.weekday.en} - ${hijriDate.weekday.en} ( ${hijriDate.weekday.ar} )`
          );

          setDateInfo({
            hijri: `${hijriDate.day} ${hijriDate.month.en} ( ${hijriDate.month.ar} ) ${hijriDate.year}`,
            gregorian: `${gregorianDate.day} ${gregorianDate.month.en} ( ${
              traditionalMonths[gregorianDate.month.en]
            } ) ${gregorianDate.year}`,
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

          startToggleInterval();
        } else {
          setIsLoading(false);
          console.error("Error fetching data from API");
        }
      })
      .catch((error) => {
        setIsLoading(false);
        console.error("Error:", error);
      });
  }, [location]);

  const startToggleInterval = () => {
    const toggleInterval = setInterval(() => {
      setShowGregorianDate((prev) => !prev);
    }, 10000);

    return () => clearInterval(toggleInterval);
  };

  const highlightNextPrayer = (prayers) => {
    const currentTime = new Date();
    let nextPrayerIndex = -1;

    for (let i = 0; i < prayers.length; i++) {
      if (!prayers[i] || !prayers[i].time) continue;

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

      if (currentTime < prayerTime && nextPrayerIndex === -1) {
        nextPrayerIndex = i;
      }
    }

    if (nextPrayerIndex === -1) {
      nextPrayerIndex = 0;
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
          <h1>Adhan Times in Your Location</h1>
          <p>{day}</p>
          {locationError && <p className="error">{locationError}</p>}
          {isLoading ? (
            <p>Loading prayer times...</p>
          ) : (
            dateInfo && (
              <div className="date">
                <p className={`${showGregorianDate ? "fade-in" : "fade-out"}`}>
                  {dateInfo.gregorian}
                </p>
                <p className={`${showGregorianDate ? "fade-out" : "fade-in"}`}>
                  {dateInfo.hijri}
                </p>
              </div>
            )
          )}
        </div>
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
