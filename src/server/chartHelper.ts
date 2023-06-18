export function getLineChartUrl({
  labels,
  data,
  title,
  isDarkMode,
}: {
  labels: string[];
  data: number[];
  title: string;
  isDarkMode: boolean;
}) {
  const chart = {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          data: data,
          borderColor: isDarkMode ? '#D7790C' : '#71190B',
          borderWidth: 2,
          backgroundColor: 'rgba(1, 1, 1, 0)',
          pointRadius: 2,
        },
      ],
    },
    options: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: title,
        fontColor: isDarkMode ? '#ddd' : '#222',
        padding: 20,
      },
      scales: {
        xAxes: [
          {
            gridLines: {
              display: false,
            },
            ticks: {
              fontColor: isDarkMode ? '#aaa' : '#666',
            },
          },
        ],
        yAxes: [
          {
            gridLines: {
              lineWidth: 0.5,
            },
            ticks: {
              fontColor: isDarkMode ? '#aaa' : '#666',
            },
          },
        ],
      },
    },
  };

  const encodedChart = encodeURIComponent(JSON.stringify(chart));
  return `https://quickchart.io/chart?c=${encodedChart}`;
}
