const inputMonto = document.getElementById("inputMonto");
const selectMoneda = document.getElementById("selectMoneda");
const resultado = document.getElementById("resultado");
const errorMsg = document.getElementById("error");
const ctx = document.getElementById("grafico");
let chart;

// Función para obtener datos desde la API o archivo local
async function obtenerDatos(moneda) {
  try {
    errorMsg.textContent = ""; // limpiar errores

    const respuesta = await fetch(`https://mindicador.cl/api/${moneda}`);

    if (!respuesta.ok) {
      throw new Error("Error al consultar la API");
    }

    return await respuesta.json(); // Formato API
  } catch (error) {
    // Retroceso: usar JSON local en caso que la API falle
    errorMsg.textContent = "La API no está disponible, usando datos locales.";

    try {
      const offline = await fetch("./assets/data/mindicador.json");
      const datosLocal = await offline.json();

      return datosLocal[moneda]; // Formato local
    } catch (err) {
      errorMsg.textContent = "Error cargando datos locales.";
      return null;
    }
  }
}

// Función para convertir
async function convertir() {
  const montoCLP = Number(inputMonto.value);
  const moneda = selectMoneda.value;

  if (isNaN(montoCLP) || montoCLP <= 0) {
    resultado.textContent = "Ingrese un monto válido.";
    return;
  }

  if (!moneda) {
    resultado.textContent = "Seleccione una moneda.";
    return;
  }

  const data = await obtenerDatos(moneda);

  if (!data) {
    resultado.textContent = "No se pudieron obtener los datos.";
    return;
  }

  let valor;

  //  Formato API real --> usa serie[0].valor esto evita problemas si la API cambia
  if (data.serie && data.serie.length > 0) {
    valor = data.serie[0].valor;
  }
  //  Formato JSON local --> usa valor esto evita problemas si la estructura cambia
  else if (data.valor) {
    valor = data.valor;
  }
  //  Sin datos válidos --> no se pudo obtener valor
  else {
    resultado.textContent = "No se pudo obtener el valor de la moneda.";
    return;
  }

  const conversion = (montoCLP / valor).toFixed(2);
  resultado.textContent = `Resultado: $${conversion}`;

  generarGrafico(data);
}

// Función para crear gráfico
function generarGrafico(data) {
  // JSON local NO tiene serie
  if (!data.serie) {
    errorMsg.textContent = "No hay historial disponible para esta moneda.";
    return;
  }

  const ultimos10 = data.serie.slice(0, 10).reverse();

  const labels = ultimos10.map(d => d.fecha.slice(0, 10));
  const valores = ultimos10.map(d => d.valor);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: `Historial últimos 10 días`,
        data: valores,
        borderWidth: 2,
        borderColor: "pink"
      }]
    }
  });
}

document.getElementById("btnBuscar").addEventListener("click", convertir);
