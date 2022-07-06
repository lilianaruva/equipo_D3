//define input range ------------------------------------------
var rangeInput = document.querySelector(".inputDiv.i1");

function Input() {
  this.att = {};
  this.att.type = "range";
  this.att.value = 1955;
  this.att.min = 1955;
  this.att.max = 2005;
  this.att.autocomplete = "off";
  this.att.step = "5";
  this.input;
  this.output;

  this.crear = function (elementoPadre) {
    // Crea un nuevo elemento input
    this.input = document.createElement("input");
    // Para cada propiedad del objeto att establece un nuevo atributo del elemento input
    for (var name in this.att) {
      if (this.att.hasOwnProperty(name)) {
        this.input.setAttribute(name, this.att[name]);
      }
    }
    // Crea un nuevo elemento div
    this.output = document.createElement("div");
    // Establece el valor del atributo class del nuevo div
    this.output.setAttribute("class", "output");
    // Y el contenido (innerHTML) de este
    this.output.innerHTML = this.att.value;

    // Inserta los dos elementos creados al final del elemento Padre
    elementoPadre.appendChild(this.input);
    elementoPadre.appendChild(this.output);
  };

  this.actualizar = function () {
    this.output.innerHTML = this.input.value;
    this.att.value = this.input.value;
  };
}

// Setup
var i = new Input();
i.crear(rangeInput);

// Selección de gráfica
const graf = d3.select("#my_dataviz");

// Dimensiones
var margin = { top: 60, right: 20, bottom: 75, left: 100 },
  width = graf.style("width").slice(0, -2) - margin.left - margin.right,
  height = 420 - margin.top - margin.bottom;

var svg;
var tooltip;

const draw = async (year = "1955") => {
  // Se agrega el elemento svg
  svg = d3
    .select("#my_dataviz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // Lectura de archivo CSV
  d3.csv("gapminder.csv", function (data) {
    // Definición de variables
    const xAxisLabel = "Fertilidad";
    const YAxisLabel = "Esperanza de Vida";

    // Regiones
    const regions = [
      { index: 0, label: "Asia del Sur" },
      { index: 1, label: "Europa & Asia Central" },
      { index: 2, label: "Sub-Sahara África" },
      { index: 3, label: "América" },
      { index: 4, label: "Asia del Este & Pacífico" },
      { index: 5, label: "África del Norte y del Este" },
      { index: "todos", label: "Todos" },
    ];

    // Selección de Regiones
    const selcon = d3.select("#continent");

    selcon
      .selectAll("option")
      .data(regions)
      .enter()
      .append("option")
      .attr("value", (d) => d.index)
      .text((d) => d.label);

    let filtroContinente = "todos";
    selcon.node().value = filtroContinente;

    selcon.on("change", () => {
      filtroContinente = selcon.node().value;
      step(year);
    });

    // Escalador X
    var x = d3
      .scaleLinear()
      .domain([0, 9])
      .range([0, width]);

    // Escalador Y
    var y = d3
      .scaleLinear()
      .domain([20, 90])
      .range([height, 0]);

    // Escalador Z
    var z = d3
      .scaleLinear()
      .domain([200000, 1310000000])
      .range([4, 40]);

    // Escalador Color
    var myColor = d3
      .scaleOrdinal()
      .domain(["Asia", "Europe", "Americas", "Africa", "Oceania"])
      .range(d3.schemeSet2);

    // Eje X
    svg
      .append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .append("text")
      .attr("text-anchor", "end")
      .attr("fill", "black")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("x", width - margin.right)
      .attr("y", -10)
      .text(xAxisLabel);

    // Ejes X auxiliares
    var xgridlines = d3
      .axisLeft()
      .tickFormat("")
      .tickSize(-width)
      .ticks(10)
      .scale(y);

    svg.append("g").attr("class", "minor-grid").call(xgridlines);

    // Eje Y
    svg
      .append("g")
      .call(d3.axisLeft(y))
      .append("text")
      .attr("transform", `translate(20, ${margin.top - 50}) rotate(-90)`)
      .attr("text-anchor", "end")
      .attr("fill", "black")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .text(YAxisLabel);

    // Ejes Y auxiliares
    var ygridlines = d3
      .axisTop()
      .tickFormat("")
      .tickSize(-height)
      .ticks(10)
      .scale(x);

    svg.append("g").attr("class", "minor-grid").call(ygridlines);

    // Creación de elemento tooltip
    tooltip = d3
      .select("#my_dataviz")
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "black")
      .style("border-radius", "5px")
      .style("padding", "10px")
      .style("color", "white");

    // Funciones Mostrar, Actualizar y Esconder tooltip
    var showTooltip = function (d) {
      tooltip.transition().duration(20);
      tooltip
        .style("opacity", 1)
        .html(
          "País: " +
            d.country +
            " - Población: " +
            d.pop.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
            " - Esperanza: " +
            d.life_expect +
            " - Fertilidad: " +
            d.fertility
        )
        .style("left", d3.mouse(this)[0] + 30 + "px")
        .style("top", d3.mouse(this)[1] + 30 + "px");
    };
    var moveTooltip = function (d) {
      tooltip
        .style("left", d3.mouse(this)[0] + 30 + "px")
        .style("top", d3.mouse(this)[1] + 30 + "px");
    };
    var hideTooltip = function (d) {
      tooltip.transition().duration(200).style("opacity", 0);
    };

    const chart = svg.append("g");

    // Gráfico de Círculos de Población
    const step = (year) => {
      let newDataset = data.filter(
        (d) => d.year == year,
        (d) => d.country
      );

      if (filtroContinente != "todos") {
        newDataset = newDataset.filter((d) => d.cluster == filtroContinente);
      }

      // Limpieza de Círculos de Población
      d3.selectAll("circle").remove();

      // Círculos de Población
      const circles = chart
        .selectAll("dot")
        .data(newDataset)
        .enter()
        .append("circle")
        .attr("class", "bubbles")
        .attr("cx", function (d) {
          return x(d.fertility);
        })
        .attr("cy", function (d) {
          return y(d.life_expect);
        })
        .attr("r", function (d) {
          return z(d.pop);
        })
        .style("fill", function (d) {
          return myColor(d.cluster);
        })
        // Trigger de las funciones
        .on("mouseover", showTooltip)
        .on("mousemove", moveTooltip)
        .on("mouseleave", hideTooltip);
    };

    step(year);
  });
};

i.input.addEventListener("input", function () {
  i.actualizar();
  d3.select("svg").remove(); // Eliminación elemento svg
  tooltip.remove(); // Eliminación elemento tooltip
  draw(i.att.value);
});

draw(1955);
