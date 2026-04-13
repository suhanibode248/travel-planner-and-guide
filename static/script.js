function goToOutput() {
  document.getElementById("inputSlide").classList.remove("active");
  document.getElementById("outputSlide").classList.add("active");
}

function goBack() {
  document.getElementById("outputSlide").classList.remove("active");
  document.getElementById("inputSlide").classList.add("active");
}

function toggleDarkMode() {
  document.body.classList.toggle("dark");
}

function switchCity(index) {
  document.querySelectorAll(".city-section").forEach(sec => sec.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));

  document.getElementById("city-" + index).classList.add("active");
  document.getElementById("tab-" + index).classList.add("active");
}

function getBudgetSplit(budget) {
  return {
    Hotels: Math.round(budget * 0.4),
    Food: Math.round(budget * 0.2),
    Transport: Math.round(budget * 0.2),
    Activities: Math.round(budget * 0.2)
  };
}

function getPrice(type) {
  if (type === "budget") return "₹500 - ₹1500";
  if (type === "mid") return "₹2000 - ₹5000";
  return "₹8000+";
}

function getRating(type) {
  if (type === "budget") return "⭐ 4.0";
  if (type === "mid") return "⭐ 4.3";
  return "⭐ 4.7";
}

function getSuggestion(budget) {
  if (budget < 5000) return "💡 Tip: Choose budget hotels";
  if (budget < 20000) return "💡 Tip: Balance comfort & cost";
  return "💡 Tip: Enjoy luxury experience!";
}

async function generatePlan() {

  document.getElementById("result").innerHTML = "⏳ Generating...";

  const budget = parseInt(document.getElementById("budget").value);

  const res = await fetch("/generate", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      destination: document.getElementById("destination").value,
      days: document.getElementById("days").value,
      budget: budget,
      trip_type: document.getElementById("trip_type").value
    })
  });

  const data = await res.json();

  let tabsHTML = "";
  let contentHTML = "";

  data.forEach((city, index) => {

    const daysList = city.plan.split("\n");

    tabsHTML += `<button id="tab-${index}" class="tab-btn ${index===0?'active':''}" onclick="switchCity(${index})">📍 ${city.city}</button>`;

    contentHTML += `
    <div id="city-${index}" class="city-section ${index===0?'active':''}">
      <div class="card">

        <h2>📍 ${city.city}</h2>

        <!-- ✅ TODAY PLAN -->
        <h3>📢 Today's Plan</h3>
        <div class="day-block">
          🌟 Today: ${daysList[0].replace("Day 1: ", "")}
        </div>

        <!-- ✅ ITINERARY -->
        <h3>📅 Itinerary</h3>
        ${daysList.map(line => `<div class="day-block">🗓 ${line}</div>`).join("")}

        <!-- ✅ PROGRESS -->
        <h3>📈 Trip Progress</h3>
        <div class="day-block">
          ✅ Day 1 Completed<br>
          ⏳ Remaining Days: ${daysList.length - 1}
        </div>

        <!-- ✅ PLACES -->
        <h3>📌 Places</h3>
        ${city.places.map(p => `
          <div class="item">
            <div>📍 ${p.name}</div>
            <a href="https://www.google.com/maps/search/${p.name} ${city.city}" target="_blank">
              <button class="map-btn">Map</button>
            </a>
          </div>
        `).join("")}

        <!-- ✅ HOTELS -->
        <h3>🏨 Hotels</h3>
        ${city.hotels.map(h => `
          <div class="item">
            <div>
              🏨 <b>${h.name}</b><br>
              💰 ${getPrice(h.type)} | ${getRating(h.type)}
            </div>
            <a href="${h.link}" target="_blank">
              <button class="book-btn">Book</button>
            </a>
          </div>
        `).join("")}

        <!-- ✅ FOOD -->
        <h3>🍴 Food</h3>
        ${city.food.street_food.map(f => `<div class="simple-item">🍴 ${f}</div>`).join("")}

        <!-- ✅ RESTAURANTS -->
        <h3>🍽 Restaurants</h3>
        ${city.food.restaurants.map(r => `
          <div class="item">
            <div>🍽 ${r.name}</div>
            <a href="${r.link}" target="_blank">
              <button class="reserve-btn">Reserve</button>
            </a>
          </div>
        `).join("")}

        <!-- ✅ TRANSPORT -->
        <h3>🚕 Transport</h3>
        <div class="transport-row">
        ${city.transport.cabs.map(c => `
          <a href="${c.link}" target="_blank">
            <button class="cab-btn">🚕 ${c.name}</button>
          </a>
        `).join("")}
        </div>

        <!-- ✅ BUDGET -->
        <h3>📊 Budget Distribution</h3>
        <div class="chart-container">
          <canvas id="chart-${index}"></canvas>
        </div>
        <div class="budget-text" id="budget-text-${index}"></div>

        <!-- ✅ SUGGESTION -->
        <h3>🤖 Smart Suggestions</h3>
        <div class="suggestion-box">
          ${getSuggestion(budget)}
        </div>

        <!-- ✅ COMPLETION -->
        <h3>🎉 Completion</h3>
        <div class="suggestion-box">
          🎉 Congratulations! You completed your trip to ${city.city} with us!
        </div>

      </div>
    </div>
    `;
  });

  document.getElementById("tabs").innerHTML = tabsHTML;
  document.getElementById("result").innerHTML = contentHTML;

  data.forEach((city, index) => {
    const split = getBudgetSplit(budget);
    const total = Object.values(split).reduce((a, b) => a + b, 0);

    const percentageText = Object.entries(split).map(([key, value]) => {
      const percent = Math.round((value / total) * 100);
      return `${key}: ${percent}%`;
    }).join("<br>");

    document.getElementById(`budget-text-${index}`).innerHTML = percentageText;

    new Chart(document.getElementById(`chart-${index}`), {
      type: 'pie',
      data: {
        labels: Object.keys(split),
        datasets: [{
          data: Object.values(split)
        }]
      }
    });
  });

  goToOutput();
}