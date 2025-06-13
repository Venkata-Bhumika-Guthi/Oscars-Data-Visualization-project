function _1(md){return(
md`# Final Project Presentation (04/30/2025)`
)}

function _2(md){return(
md`# Project Overview
# Title : Oscars Insights: Genres, Directors, and Wins

Name : Venkata Bhumika Guthi

Z-ID : Z2016526`
)}

function _3(md){return(
md`# Table of Contents
 
Task 1: Actor–Director Collaboration Network 

Task 2:Genre × Category Heatmap 

Task 3:Director Career Timeline 

Task 4: Category Lifespan Timeline 

Tasks improvement based on proposal feedback and Data enrichment using some external data source`
)}

function _4(md){return(
md`# Data Sources & Processing

Main Dataset: Oscar nomination and win data.

IMDb Dataset: For enriching each film with genre labels.

Merged Using: Film IDs(from Oscars dataset) and tconst(in IMDB dataset) to create unified views.

`
)}

function _5(md){return(
md`
# Visualizations Built

Bipartite Network: Shows links from actors → genres → directors for Oscar-winning films.

Heatmap: Displays how many times each genre won in each Oscar category.

Director Timeline: Dot timeline shows when each top director was nominated or won.

Category Evolution Chart : Lifespan of Oscar categories across time.
`
)}

function _6(md){return(
md`# Interactivity Design

View : Actor–Genre–Director Bipartite + Director Timeline

Hover over an actor/director: highlights the counterpart and the genre they’re linked through.

Hover over a genre: highlights directors in timeline who won for that genre.`
)}

function _7(md){return(
md`# Task 1

Design 1 – Director–Actor Collaboration Network (GOOD)
Target:
Reveal creative director–actor pairings that lead to Oscar wins.

Data:
Filtered Oscar wins joined by actor, director, film, and year.

Visual Structure:

Radial network (chord-style layout)

Nodes = actors (right, black) and directors (left, red)

Links = winning collaborations

Interactivity:

Hovering a name highlights its link

Tooltip shows actor, director, film, and year

Reasoning:
Great for discovering high-impact partnerships like Scorsese–DiCaprio. Aesthetically engaging, compact, and reveals asymmetric connections clearly.

`
)}

function _d3(require){return(
require("d3@7")
)}

async function _oscarsData(d3){return(
await d3.dsv("\t", "https://raw.githubusercontent.com/DLu/oscar_data/refs/heads/main/oscars.csv")
)}

function _actingData(oscarsData){return(
oscarsData.filter(d => d.Class === "Acting" && d.FilmId && d.NomineeIds)
)}

function _directingDatatask1(oscarsData){return(
oscarsData.filter(d => d.Class === "Directing" && d.FilmId && d.NomineeIds)
)}

function _filmDirectorMap(directingDatatask1){return(
new Map(
  directingDatatask1.map(d => [d.FilmId.trim(), d.Name.trim()])
)
)}

function _directorActorPairs(actingData,filmDirectorMap)
{
  const pairs = [];

  for (const d of actingData) {
    const filmId = d.FilmId?.trim();
    const actor = d.Name?.trim();
    const director = filmDirectorMap.get(filmId);

    if (director && actor) {
      pairs.push({
        director,
        actor,
        win: d.Winner === "True" ? 1 : 0,
        nomination: 1
      });
    }
  }

  return pairs;
}


function _collaborationStats(directingDatatask1)
{
  const pairs = new Map();

  for (const d of directingDatatask1) {
    if (!d.Film || !d.Nominees || !d.NomineeIds || !d.Winner) continue;

    const director = d.Name;
    const actors = d.Nominees.split(","); 
    const year = parseInt(d.Year.slice(0, 4)); // extract starting year

    for (const actor of actors) {
      const key = `${director}|||${actor.trim()}`;

      if (!pairs.has(key)) {
        pairs.set(key, {
          director,
          actor: actor.trim(),
          nominations: 0,
          wins: 0,
          years: new Set() 
        });
      }

      const pairData = pairs.get(key);
      pairData.nominations += 1;
      if (d.Winner === "True") pairData.wins += 1;
      pairData.years.add(year);
    }
  }

  return Array.from(pairs.values()).map(d => ({
    ...d,
    year: Math.min(...d.years)
  }));
}


function _filteredCollabs1(collaborationStats){return(
collaborationStats.filter(d =>
  d.wins > 0 &&
    Math.min(...Array.from(d.years)) >= 1995
)
)}

function _actorDirectorWins(oscarsData)
{
  const winsOnly = oscarsData.filter(d =>
    d.Class === "Acting" &&
    d.Winner === "True" &&
    d.Film &&
    d.Name
  );

  const directorEntries = oscarsData.filter(d =>
    d.Class === "Directing" &&
    d.Winner === "True" &&
    d.Film &&
    d.Name
  );

  // Mapping director and actor
  const filmToDirector = new Map();
  for (const entry of directorEntries) {
    const film = entry.Film.trim();
    const directors = entry.Name.split(/,|&| and /).map(d => d.trim());
    for (const director of directors) {
      filmToDirector.set(film, director);
    }
  }

  const pairs = [];

  for (const entry of winsOnly) {
    const film = entry.Film.trim();
    const actor = entry.Name.trim();
    const director = filmToDirector.get(film);
    if (director && director !== actor) {
      pairs.push({
        actor,
        director,
        film: film,
        year: entry.Year
      });
    }
  }

  return pairs;
}


function _radialData(actorDirectorWins)
{
  const nodes = new Set();
  const links = [];

  for (const { actor, director } of actorDirectorWins) {
    nodes.add(actor);
    nodes.add(director);
    links.push({
      source: actor,
      target: director
    });
  }

  return {
    nodes: Array.from(nodes).map(name => ({ name })),
    links
  };
}


function _radialNetwork1(d3,actorDirectorWins)
{
  const width = 900;
  const radius = width / 2;
  const innerRadius = radius - 120;

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", width)
    .style("font", "11px sans-serif");

  const g = svg.append("g")
    .attr("transform", `translate(${radius},${radius})`);

  const cluster = d3.cluster().size([2 * Math.PI, innerRadius]);

  const uniqueNames = Array.from(new Set([
    ...actorDirectorWins.map(d => d.actor),
    ...actorDirectorWins.map(d => d.director)
  ]));

  const nodes = uniqueNames.map(name => ({
    name,
    type: actorDirectorWins.some(d => d.actor === name) ? "actor" : "director"
  }));

  const links = actorDirectorWins.map(({ actor, director, film, year }) => ({
    source: actor,
    target: director,
    film,
    year
  }));

  const root = d3.hierarchy({ children: nodes }).sum(() => 1);
  cluster(root);

  const nameToNode = new Map();
  root.leaves().forEach(d => {
    nameToNode.set(d.data.name, d);
  });

  const line = d3.radialLine()
    .curve(d3.curveBundle.beta(0.85))
    .radius(d => d.y)
    .angle(d => d.x);

  const pathData = links.map(link => {
    const path = nameToNode.get(link.source).path(nameToNode.get(link.target));
    path.linkInfo = link;
    return path;
  });

  const tooltip = d3.select("body").append("div")
    .style("position", "absolute")
    .style("padding", "8px 12px")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("border-radius", "6px")
    .style("pointer-events", "none")
    .style("font-size", "12px")
    .style("box-shadow", "0 2px 6px rgba(0,0,0,0.15)")
    .style("opacity", 0);

  const link = g.append("g")
    .attr("fill", "none")
    .attr("stroke", "#ccc")
    .attr("stroke-opacity", 0.4)
    .selectAll("path")
    .data(pathData)
    .join("path")
    .attr("class", "link")
    .attr("d", line);

  const label = g.append("g")
    .selectAll("text")
    .data(root.leaves())
    .join("text")
    .attr("dy", "0.31em")
    .attr("transform", d => `
      rotate(${d.x * 180 / Math.PI - 90})
      translate(${d.y + 8},0)
      ${d.x >= Math.PI ? "rotate(180)" : ""}
    `)
    .attr("text-anchor", d => d.x < Math.PI ? "start" : "end")
    .attr("fill", d => d.data.type === "director" ? "red" : "black")
    .text(d => d.data.name)
    .on("mouseover", (event, d) => {
      const name = d.data.name;

      label.attr("fill", o =>
        o.data.name === name ? "#000" : (o.data.type === "director" ? "red" : "black")
      );

      link
        .attr("stroke", l => 
          (l.linkInfo.source === name || l.linkInfo.target === name) ? "#2ca02c" : "#ccc")
        .attr("stroke-opacity", l =>
          (l.linkInfo.source === name || l.linkInfo.target === name) ? 1 : 0.1);

      const collaborations = actorDirectorWins.filter(
        d => d.actor === name || d.director === name
      );

      const tooltipHTML = collaborations.map(d => 
        `<strong>${d.film}</strong><br>
         Actor: ${d.actor}<br>
         Director: ${d.director}<br>
         Year: ${d.year}`
      ).join("<hr>");

      tooltip.transition().duration(100).style("opacity", 1);
      tooltip.html(tooltipHTML)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 40) + "px");
    })
    .on("mouseout", () => {
      label.attr("fill", d => d.data.type === "director" ? "red" : "black");
      link.attr("stroke", "#ccc").attr("stroke-opacity", 0.4);
      tooltip.transition().duration(200).style("opacity", 0);
    });

  return svg.node();
}


function _19(md){return(
md`# Task 2

DESIGN 2 – Genre vs. Category Heatmap (Good)
Target:
Do certain genres dominate specific Oscar categories? Are some genres more successful in technical awards vs. performance-based categories?

Data:
Merged IMDb genre data and Oscar award data, joined via FilmId.
Final format includes genre, CanonicalCategory, and count of wins.


Visual Structure:
Heatmap with:

X-axis: Canonical award categories

Y-axis: Genres

Color: Number of wins (sequential scale)

Interactivity:

Dropdown to filter by genre

Tooltip shows exact count of wins for genre × category combo

Reasoning:
Heatmaps are excellent at showing distribution intensity across two categorical dimensions. This one immediately reveals genre biases across Oscar history.
`
)}

function _imdbGenres(FileAttachment){return(
FileAttachment("imdb_genres.csv").csv()
)}

function _oscarsWithGenres(oscarsData,imdbGenres){return(
oscarsData.map(d => {
  const genreMatch = imdbGenres.find(g => g.tconst === d.FilmId);
  return {
    ...d,
    genres: genreMatch?.genres ?? "Unknown"
  };
})
)}

function _oscarsExpandedGenres(oscarsWithGenres){return(
oscarsWithGenres.flatMap(d =>
  d.genres.split(",").map(genre => ({
    ...d,
    genre: genre.trim()
  }))
)
)}

function _genreCategoryMatrix(d3,oscarsExpandedGenres)
{
  const counts = d3.rollups(
    oscarsExpandedGenres.filter(d => d.Winner === "True" && d.genre !== "Unknown"),
    v => v.length,
    d => d.genre,
    d => d.CanonicalCategory
  );

  return counts.flatMap(([genre, categories]) =>
    categories.map(([category, count]) => ({
      genre,
      category,
      count
    }))
  );
}


function _genreCategoryHeatmap(d3,genreCategoryMatrix,DOM)
{
  const margin = { top: 250, right: 200, bottom: 100, left: 100 };
  const fullWidth = 1200;
  const fullHeight = 900;
  const width = fullWidth - margin.left - margin.right;
  const height = fullHeight - margin.top - margin.bottom;

  const svg = d3.create("svg")
    .attr("width", fullWidth)
    .attr("height", fullHeight + 80)
    .style("font-family", "sans-serif")
    .style("overflow", "visible");

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const genres = Array.from(new Set(genreCategoryMatrix.map(d => d.genre))).sort();
  const categories = Array.from(new Set(genreCategoryMatrix.map(d => d.category))).sort();

  const selector = d3.select(DOM.element("div"))
    .style("margin-bottom", "10px")
    .append("select");

  selector
    .selectAll("option")
    .data(["All Genres", ...genres])
    .join("option")
    .text(d => d);

  const maxCount = d3.max(genreCategoryMatrix, d => d.count);
  const color = d3.scaleSequential()
    .interpolator(d3.interpolateYlGnBu)
    .domain([0, maxCount]);

  const x = d3.scaleBand().domain(categories).range([0, width]).padding(0.05);
  const y = d3.scaleBand().domain(genres).range([0, height]).padding(0.05);

  const render = (selectedGenre) => {
    let data = selectedGenre === "All Genres"
      ? genreCategoryMatrix
      : genreCategoryMatrix.filter(d => d.genre === selectedGenre);

    g.selectAll("rect").remove();

    g.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", d => x(d.category))
      .attr("y", d => y(d.genre))
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("fill", d => color(d.count))
      .append("title")
      .text(d => `${d.genre} × ${d.category}: ${d.count}`);
  };

  g.append("g").call(d3.axisLeft(y));
  g.append("g")
    .call(d3.axisTop(x))
    .selectAll("text")
    .attr("transform", "rotate(-90)")
    .style("text-anchor", "start")
    .attr("dx", "1.0em")
    .attr("dy", "1.4em");

  const legendWidth = 200;
  const legendHeight = 10;
  const legendX = (width + margin.left + margin.right - legendWidth) / 2;
  const legendY = height + margin.top + 40;

  const defs = svg.append("defs");
  const gradient = defs.append("linearGradient")
    .attr("id", "legendGradient");

  gradient.selectAll("stop")
    .data(d3.ticks(0, 1, 10))
    .enter()
    .append("stop")
    .attr("offset", d => `${d * 100}%`)
    .attr("stop-color", d => color(d * maxCount));

  svg.append("rect")
    .attr("x", legendX)
    .attr("y", legendY)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legendGradient)");

  const legendScale = d3.scaleLinear()
    .domain([0, maxCount])
    .range([legendX, legendX + legendWidth]);

  const legendAxis = d3.axisBottom(legendScale)
    .ticks(5)
    .tickFormat(d3.format("d"));

  svg.append("g")
    .attr("transform", `translate(0, ${legendY + legendHeight})`)
    .call(legendAxis);

  svg.append("text")
    .attr("x", legendX + legendWidth / 2)
    .attr("y", legendY - 6)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text("Number of Wins");

  render("All Genres");

  selector.on("change", function () {
    const selected = this.value;
    render(selected);
  });

  const wrapper = document.createElement("div");
  wrapper.appendChild(selector.node());
  wrapper.appendChild(svg.node());

  return wrapper;
}


function _25(md){return(
md`# Bipartite network`
)}

function _actorDirectorGenreData(actorDirectorWins,oscarsExpandedGenres)
{
  const pairs = [];

  for (const { actor, director, film, year } of actorDirectorWins) {
    if (!film) continue;
    const filmTitles = film.split("|").map(d => d.trim());

    for (const title of filmTitles) {
      const match = oscarsExpandedGenres.find(d => d.Film?.includes(title) && d.genre && d.genre !== "Unknown");

      if (match) {
        pairs.push({
          actor,
          director,
          genre: match.genre,
          movie: title,
          award: match.CanonicalCategory,
          year: year
        });
      }
    }
  }

  return pairs;
}


function _bipartiteData(actorDirectorGenreData)
{
  const actors = [...new Set(actorDirectorGenreData.map(d => d.actor.trim()))];
  const genres = [...new Set(actorDirectorGenreData.map(d => d.genre.trim()))];
  const directors = [...new Set(actorDirectorGenreData.map(d => d.director.trim()))];

  const nodes = [
    ...actors.map(name => ({ id: name, type: "actor" })),
    ...genres.map(name => ({ id: name, type: "genre" })),
    ...directors.map(name => ({ id: name, type: "director" }))
  ];

  const nodeById = new Map(nodes.map(d => [d.id, d]));

  const links = [
    ...actorDirectorGenreData.map(d => ({
      source: nodeById.get(d.actor.trim()),
      target: nodeById.get(d.genre.trim()),
      movie: d.movie,
      award: d.award,
      year: d.year
    })),
    ...actorDirectorGenreData.map(d => ({
      source: nodeById.get(d.genre.trim()),
      target: nodeById.get(d.director.trim()),
      movie: d.movie,
      award: d.award,
      year: d.year
    }))
  ];

  return { nodes, links };
}


function _bipartiteOscars(d3,bipartiteData,actorDirectorGenreData,updateTimelineHighlight,clearTimelineHighlight)
{
  const width = 1300;
  const height = 1200;

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("font", "10px sans-serif")
    .style("background", "#fff");
  
 svg.append("text")
    .attr("x", 95)
    .attr("y", 40)
    .attr("text-anchor", "middle")
    .style("font-size", "25px")
    .style("font-weight", "bold")
    .style("fill", "#1f77b4")
    .text("Actors");

  svg.append("text")
    .attr("x", width - 110)
    .attr("y", 40)
    .attr("text-anchor", "middle")
    .style("font-size", "25px")
    .style("font-weight", "bold")
    .style("fill", "#2ca02c")
    .text("Directors");

  const color = d3.scaleOrdinal()
    .domain(["actor", "genre", "director"])
    .range(["#1f77b4", "#000000", "#2ca02c"]); 

  const { nodes, links } = bipartiteData;

  const xPosition = {
    actor: 100,
    genre: width / 2,
    director: width - 100
  };

  nodes.forEach(node => {
    node.x = xPosition[node.type];
  });

  const groupNodes = d3.groups(nodes, d => d.type);
  groupNodes.forEach(([type, group]) => {
    const scale = d3.scalePoint()
      .domain(group.map(d => d.id))
      .range([100, height - 100]);
    group.forEach(d => {
      d.y = scale(d.id);
    });
  });

  function curvedLink(d) {
    const midX = (d.source.x + d.target.x) / 2;
    return `
      M${d.source.x},${d.source.y}
      C${midX},${d.source.y} ${midX},${d.target.y} ${d.target.x},${d.target.y}
    `;
  }

  const link = svg.append("g")
    .attr("fill", "none")
    .attr("stroke-opacity", 0.5)
    .selectAll("path")
    .data(links)
    .join("path")
    .attr("stroke", "#aaa")
    .attr("stroke-width", 2)
    .attr("d", curvedLink);

  const nodeGroup = svg.append("g");

  const genreNodes = nodeGroup.selectAll(".genre")
    .data(nodes.filter(d => d.type === "genre"))
    .join("g")
    .attr("transform", d => `translate(${d.x},${d.y})`);

  genreNodes.append("rect")
    .attr("x", -40)
    .attr("y", -10)
    .attr("width", 80)
    .attr("height", 20)
    .attr("fill", "#000")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5);

  genreNodes.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr("fill", "white")
    .text(d => d.id);

  const circleNodes = nodeGroup.selectAll(".circle")
    .data(nodes.filter(d => d.type !== "genre"))
    .join("circle")
    .attr("r", 5)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("fill", d => color(d.type))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5);

  const label = svg.append("g")
    .selectAll("text")
    .data(nodes.filter(d => d.type !== "genre"))
    .join("text")
    .attr("x", d => d.x + (d.type === "actor" ? -12 : d.type === "director" ? 12 : 0))
    .attr("y", d => d.y)
    .attr("dy", "0.32em")
    .attr("text-anchor", d => d.type === "actor" ? "end" : "start")
    .text(d => d.id)
    .style("fill", "#333");

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "rgba(255,255,255,0.95)")
    .style("padding", "10px 15px")
    .style("border", "1px solid #999")
    .style("border-radius", "8px")
    .style("box-shadow", "0 2px 12px rgba(0,0,0,0.2)")
    .style("pointer-events", "none")
    .style("font-size", "12px")
    .style("color", "#333")
    .style("opacity", 0)
    .style("z-index", 1000);

  function highlight(event, d) {
    const directNodes = new Set();
    const genreNodesSet = new Set();

    if (d.type === "actor") {
      const genres = links
        .filter(l => l.source.id === d.id || l.target.id === d.id)
        .map(l => (l.source.type === "genre" ? l.source.id : l.target.id));

      genres.forEach(genre => {
        const directors = links
          .filter(l => l.source.id === genre || l.target.id === genre)
          .map(l => (l.source.type === "director" ? l.source.id : l.target.id));

        directors.forEach(director => {
          const hasDirectLink = actorDirectorGenreData.find(e =>
            e.actor === d.id && e.director === director && e.genre === genre
          );
          if (hasDirectLink) {
            directNodes.add(director);
          } else {
            genreNodesSet.add(director);
          }
        });

        directNodes.add(genre);
      });

      directNodes.add(d.id);
    }
    else if (d.type === "director") {
      const genres = links
        .filter(l => l.source.id === d.id || l.target.id === d.id)
        .map(l => (l.source.type === "genre" ? l.source.id : l.target.id));

      genres.forEach(genre => {
        const actors = links
          .filter(l => l.source.id === genre || l.target.id === genre)
          .map(l => (l.source.type === "actor" ? l.source.id : l.target.id));

        actors.forEach(actor => {
          const hasDirectLink = actorDirectorGenreData.find(e =>
            e.actor === actor && e.director === d.id && e.genre === genre
          );
          if (hasDirectLink) {
            directNodes.add(actor);
          } else {
            genreNodesSet.add(actor);
          }
        });

        directNodes.add(genre);
      });

      directNodes.add(d.id);
    }
    else if (d.type === "genre") {
      // For genre nodes, no tooltip, but highlight connections
      links.forEach(l => {
        if (l.source.id === d.id || l.target.id === d.id) {
          if (l.source.type === "actor" || l.source.type === "director") {
            genreNodesSet.add(l.source.id);
          }
          if (l.target.type === "actor" || l.target.type === "director") {
            genreNodesSet.add(l.target.id);
          }
        }
      });
      directNodes.add(d.id);
    }

    circleNodes.attr("fill", n =>
      directNodes.has(n.id) ? "#ff4136" :
      genreNodesSet.has(n.id) ? "#ff851b" : "#ddd"
    );

    genreNodes.select("rect").attr("fill", n =>
      directNodes.has(n.id) ? "#ff4136" : "#000"
    );


    label.style("fill", n =>
      directNodes.has(n.id) ? "#000" :
      genreNodesSet.has(n.id) ? "#555" : "#aaa"
    );

    link
      .attr("stroke", l => {
        if (directNodes.has(l.source.id) && directNodes.has(l.target.id)) return "#ff4136";
        if (genreNodesSet.has(l.source.id) || genreNodesSet.has(l.target.id)) return "#ff851b";
        return "#ccc";
      })
      .attr("stroke-opacity", l => {
        if (directNodes.has(l.source.id) && directNodes.has(l.target.id)) return 1;
        if (genreNodesSet.has(l.source.id) || genreNodesSet.has(l.target.id)) return 0.5;
        return 0.05;
      });

    
//interactivity
    if (d.type === "actor" || d.type === "director") {
    const actorName = d.type === "actor" ? d.id : null;
    const directorName = d.type === "director" ? d.id : null;

    // Find associated director(s)
    const associatedDirectors = new Set();

    if (actorName) {
      actorDirectorGenreData.forEach(entry => {
        if (entry.actor === actorName) associatedDirectors.add(entry.director);
      });
    } else if (directorName) {
      associatedDirectors.add(directorName);
    }

    if (typeof updateTimelineHighlight === "function") {
      updateTimelineHighlight([...associatedDirectors]);
    }
  }

  if (d.type === "genre") {
    const directors = actorDirectorGenreData
      .filter(entry => entry.genre === d.id)
      .map(entry => entry.director);

    if (typeof updateTimelineHighlight === "function") {
      updateTimelineHighlight([...new Set(directors)]);
    }
  }


    
if (d.type === "genre") {
  tooltip.transition().duration(200).style("opacity", 0);
} else {
  const offsetX = d.type === "director" ? -250 : 20;
  const tooltipHeight = 120; 
  let mouseX = event.pageX + offsetX;
  let mouseY;

  if (event.pageY + tooltipHeight + 20 > window.innerHeight) {
    mouseY = event.pageY - tooltipHeight - 20; // above the mouse
  } else {
    mouseY = event.pageY + 20; // below the mouse
  }

  const tooltipLinks = links.filter(l => l.source.id === d.id || l.target.id === d.id);

  const tooltipHTML = tooltipLinks.map(l => `
    <b>Movie:</b> ${l.movie}<br>
    <b>Award:</b> ${l.award}<br>
    <b>Year:</b> ${l.year}
  `).join("<hr style='border: 0; border-top: 1px solid #ccc; margin: 6px 0;'>");

  tooltip.transition().duration(100).style("opacity", 1);
  tooltip.html(tooltipHTML)
    .style("left", `${mouseX}px`)
    .style("top", `${mouseY}px`);
}


  }

  function restore() {
    circleNodes.attr("fill", d => color(d.type));
    genreNodes.select("rect").attr("fill", "#000");
    label.style("fill", "#333");
    link.attr("stroke", "#aaa").attr("stroke-opacity", 0.5);
    tooltip.transition().duration(200).style("opacity", 0);
  }

  circleNodes.on("mouseover", highlight).on("mouseout", restore);
  genreNodes.select("rect").on("mouseover", highlight).on("mouseout", restore);
  label.on("mouseover", highlight).on("mouseout", restore);
  if (typeof clearTimelineHighlight === "function") clearTimelineHighlight();

 // clearHeatmapHighlight();
  //clearTimelineHighlight();


  return svg.node();
}


function _29(md){return(
md`# Task 3

DESIGN 3 – Director Career Timelines (Dot Plot)
Target:
How consistent are directors in receiving Oscar nominations or wins over time? Which directors have long award trajectories?

Data:
Filtered director nomination and win data from Oscars, including director, year, win.

Visual Structure:
Dot timeline:

X-axis: Year of nomination

Y-axis: Director name

Circle: Each dot = a nomination (black = win, gray = nomination)

Interactivity:

Hover shows tooltip with director, year, and award status

Reasoning:
Dot timelines reveal longevity and clustering. It’s a clean way to show which directors are consistently recognized and which ones peaked in a short span.

`
)}

function _directingData(oscarsData){return(
oscarsData.filter(d =>
  d.CanonicalCategory && d.CanonicalCategory.toLowerCase().includes("directing")
)
)}

function _31(directingData){return(
directingData
)}

function _parsedDirectingData(directingData){return(
directingData.map(d => ({
  year: +d.Year.slice(0, 4), // Extracting the first year from "1927/28"
  director: d.Name,
  win: d.Winner === "True"
}))
)}

function _33(d3,parsedDirectingData){return(
d3.extent(parsedDirectingData, d => d.year)
)}

function _topDirectingData(d3,parsedDirectingData)
{
  // Getting only top 50 most-nominated directors
  const counts = d3.rollups(
    parsedDirectingData,
    v => v.length,
    d => d.director
  );
  
  const topDirectors = counts
    .sort((a, b) => d3.descending(a[1], b[1]))
    .slice(0, 50)
    .map(d => d[0]);

  return parsedDirectingData.filter(d =>
    topDirectors.includes(d.director)
  );
}


function _directorTimelineData(d3,parsedDirectingData)
{
  const counts = d3.rollups(
    parsedDirectingData,
    v => v.length,
    d => d.director
  );
  
  const topDirectors = counts
    .sort((a, b) => d3.descending(a[1], b[1]))
    .slice(0, 479)
    .map(d => d[0]);

  return parsedDirectingData.filter(d =>
    topDirectors.includes(d.director)
  );
}


function _selectedDirector(Inputs,topDirectingData){return(
Inputs.select(
  ["All", ...new Set(topDirectingData.map(d => d.director)).values()],
  { label: "Select Director" }
)
)}

function _bipartiteDirectorSet(bipartiteData){return(
new Set(
  bipartiteData.nodes.filter(d => d.type === "director").map(d => d.id)
)
)}

function _filteredDirectingData(directorTimelineData,bipartiteDirectorSet){return(
directorTimelineData.filter(d =>
  bipartiteDirectorSet.has(d.director)
)
)}

function _filteredDirectingDataold(topDirectingData,selectedDirector){return(
topDirectingData.filter(d =>
  selectedDirector === "All" || d.director === selectedDirector
)
)}

function _directorTimelinewithAllDirectors(topDirectingData,Inputs,html,filteredDirectingDataold,d3)
{
  const margin = { top: 100, right: 30, bottom: 40, left: 160 };
  const width = 900 - margin.left - margin.right;
  const height = 800 - margin.top - margin.bottom;

  const allDirectors = [...new Set(topDirectingData.map(d => d.director))];
  const filter = Inputs.select(["All", ...allDirectors], { label: "Select Director" });

  const container = html`<div style="display: flex; flex-direction: column; gap: 20px;"></div>`;
  container.appendChild(filter);

  const wrapper = document.createElement("div");
  container.appendChild(wrapper);

  const renderChart = (selectedDirector) => {
    wrapper.innerHTML = "";

    const filtered = selectedDirector === "All"
      ? filteredDirectingDataold
      : filteredDirectingDataold.filter(d => d.director === selectedDirector);

    const svg = d3.create("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .style("font-family", "sans-serif");

    wrapper.appendChild(svg.node());

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain(d3.extent(topDirectingData, d => d.year))
      .range([0, width]);

    const y = d3.scalePoint()
      .domain([...new Set(filtered.map(d => d.director))])
      .range([0, height])
      .padding(0.5);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    g.append("g").call(d3.axisLeft(y));

    g.selectAll("circle")
      .data(filtered, d => `${d.director}-${d.year}`)
      .join(
        enter => enter.append("circle")
          .attr("cx", d => x(d.year))
          .attr("cy", d => y(d.director))
          .attr("r", 0)
          .attr("fill", d => d.win ? "#3c3c3c" : "#ccc")
          .attr("stroke", "#333")
          .transition()
          .duration(500)
          .attr("r", 6),
        update => update
          .transition()
          .duration(500)
          .attr("cx", d => x(d.year))
          .attr("cy", d => y(d.director)),
        exit => exit
          .transition()
          .duration(300)
          .attr("r", 0)
          .remove()
      )
      .append("title")
      .text(d => `${d.director} - ${d.year} ${d.win ? "Win" : "Nomination"}`);

    // Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${margin.left},20)`);

    legend.append("circle")
      .attr("cx", 0)
      .attr("r", 6)
      .attr("fill", "#3c3c3c");

    legend.append("text")
      .attr("x", 12)
      .attr("y", 4)
      .text("Win")
      .style("font-size", "12px");

    legend.append("circle")
      .attr("cx", 70)
      .attr("r", 6)
      .attr("fill", "#ccc");

    legend.append("text")
      .attr("x", 82)
      .attr("y", 4)
      .text("Nomination")
      .style("font-size", "12px");
  };

  // Initial render
  renderChart("All");

  // Re-render on selection
  filter.addEventListener("input", () => renderChart(filter.value));

  return container;
}


function _directorTimeline1(d3,directorTimelineData,filteredDirectingData,CSS)
{
  const margin = { top: 60, right: 30, bottom: 40, left: 100 };
  const width = 1000 - margin.left - margin.right;
  const height = 700 - margin.top - margin.bottom;

  const svg = d3.create("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("overflow", "visible")  
    .attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom]); // for responsiveness


  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  
  const x = d3.scaleLinear()
    .domain(d3.extent(directorTimelineData, d => d.year))
    .range([0, width]);

  const y = d3.scalePoint()
    .domain([...new Set(filteredDirectingData.map(d => d.director))])
    .range([0, height])
    .padding(0.5);

  
  g.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  g.append("g")
    .call(d3.axisLeft(y));

  const circles = g.selectAll("circle")
    .data(filteredDirectingData, d => `${d.director}-${d.year}`)
    .join(
      enter => enter.append("circle")
        .attr("class", d => `timeline-dot director-${CSS.escape(d.director)}`) 

        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.director))
        .attr("r", 0)
        .attr("fill", d => d.win ? "#3c3c3c" : "#ccc")
        .attr("stroke", "#333")
        .transition()
        .duration(500)
        .attr("r", 6),
      update => update
        .transition()
        .duration(500)
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.director)),
      exit => exit
        .transition()
        .duration(300)
        .attr("r", 0)
        .remove()
    );
g.selectAll(".timeline-dot")
  .append("title")
  .text(d => `${d.director} - ${d.year} ${d.win ? "Win" : "Nomination"}`);

const legend = svg.append("g")
  .attr("transform", `translate(${margin.left},20)`);

// Win (black)
legend.append("circle")
  .attr("cx", 0)
  .attr("cy", 0)
  .attr("r", 6)
  .attr("fill", "#3c3c3c");

legend.append("text")
  .attr("x", 12)
  .attr("y", 4)
  .text("Win")
  .style("font-size", "12px");

// Nomination (gray)
legend.append("circle")
  .attr("cx", 240)
  .attr("cy", 0)
  .attr("r", 6)
  .attr("fill", "#ccc");

legend.append("text")
  .attr("x", 252)
  .attr("y", 4)
  .text("Nomination")
  .style("font-size", "12px");

legend.append("circle")
  .attr("cx", 0)
  .attr("cy", 20)
  .attr("r", 6)
  .attr("fill", "green");

legend.append("text")
  .attr("x", 12)
  .attr("y", 24)
  .text("Green leads to Win (on highlight)")
  .style("font-size", "12px");

// Orange highlight
legend.append("circle")
  .attr("cx", 240)
  .attr("cy", 20)
  .attr("r", 6)
  .attr("fill", "orange");

legend.append("text")
  .attr("x", 252)
  .attr("y", 24)
  .text("Orange leads to Nomination (on highlight)")
  .style("font-size", "12px");


  return svg.node();
}


function _updateTimelineHighlight(d3){return(
function updateTimelineHighlight(directors) {
  d3.selectAll(".timeline-dot")
    .attr("fill", d => d.win ? "#3c3c3c" : "#ccc")
    .attr("r", 6);

  d3.selectAll(".timeline-dot").each(function(d) {
    if (directors.includes(d.director)) {
      d3.select(this)
        .attr("fill", d.win ? "#2ca02c" : "#ff851b")  
        .attr("r", 8);
    }
  });

}
)}

function _clearTimelineHighlight(d3){return(
function clearTimelineHighlight() {
  d3.selectAll(".timeline-dot")
    .attr("fill", d => d.win ? "#3c3c3c" : "#ccc")
    .attr("r", 6);
}
)}

function _44(bipartiteData){return(
bipartiteData.nodes.filter(d => d.type === "director").map(d => d.id)
)}

function _45(filteredDirectingData){return(
filteredDirectingData.map(d => d.director)
)}

function _46(bipartiteData,directorTimelineData)
{
  const bipartiteDirectors = new Set(bipartiteData.nodes.filter(d => d.type === "director").map(d => d.id));
  const timelineDirectors = new Set(directorTimelineData.map(d => d.director));

  const missing = [...bipartiteDirectors].filter(d => !timelineDirectors.has(d));

  return missing.length === 0 
    ? " All bipartite directors are present in timeline data."
    : `Missing in timeline: ${missing.join(", ")}`;
}


function _47(md){return(
md`# Task 4

DESIGN 4 – Lifespan of Oscar Categories Over Time
Target:
How have Oscar categories evolved? Which categories are long-standing, and which ones disappeared?

Data:
CanonicalCategory --> Year mapping from the Oscars dataset. Transformed into start, end for each category.

Visual Structure:
Bar chart timeline:

Y-axis: Grouped/cleaned category labels (e.g., WRITING)

X-axis: Time from 1927 to 2024

Bar: Lifespan of each category

Interactivity:

Tooltip shows start year, end year, and total lifespan in years

Reasoning:
Timeline bars are simple and effective for showing category evolution. Grouping categories (e.g., merging WRITING subtypes) makes the view cleaner.

`
)}

function _categoryLifespans(d3,oscarsData){return(
d3.rollups(
  oscarsData,
  v => ({
    start: d3.min(v, d => +d.Year.split("/")[0]),
    end: d3.max(v, d => +d.Year.split("/")[0])
  }),
  d => d.Category 
).map(([category, { start, end }]) => ({ category, start, end }))
)}

function _oscarsGroupedCategories(oscarsData){return(
oscarsData.map(d => {
  let cat = d.CanonicalCategory.toUpperCase();

  let grouped;
  if (cat.includes("WRITING")) grouped = "WRITING";
  else if (cat.includes("DIRECTING")) grouped = "DIRECTING";
  else if (cat.includes("ACTOR") || cat.includes("ACTRESS")) grouped = "ACTING";
  else if (cat.includes("SOUND") || cat.includes("VISUAL") || cat.includes("TECHNICAL")) grouped = "TECHNICAL";
  else if (cat.includes("DOCUMENTARY")) grouped = "DOCUMENTARY";
  else if (cat.includes("SHORT")) grouped = "SHORT FILMS";
  else if (cat.includes("CINEMATOGRAPHY")) grouped = "CINEMATOGRAPHY";
  else if (cat.includes("ANIMATED")) grouped = "ANIMATED";
  else if (cat.includes("MUSIC") || cat.includes("SCORE")) grouped = "MUSIC";
  else grouped = cat;

  return {
    year: +d.Year.slice(0, 4), 
    groupedCategory: grouped
  };
})
)}

function _categoryGroupLifespans(d3,oscarsGroupedCategories){return(
Array.from(
  d3.group(oscarsGroupedCategories, d => d.groupedCategory),
  ([groupedCategory, entries]) => {
    return {
      category: groupedCategory,
      start: d3.min(entries, d => d.year),
      end: d3.max(entries, d => d.year),
      group: entries[0].group 
    };
  }
).sort((a, b) => a.start - b.start)
)}

function _enhancedCategoryTimeline(categoryGroupLifespans,d3)
{
  const margin = { top: 60, right: 160, bottom: 60, left: 250 };
  const width = 960 - margin.left - margin.right;
  const height = categoryGroupLifespans.length * 28;

  categoryGroupLifespans.forEach(d => {
    if (!d.group) d.group = "Other";
  });

  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";

  const svg = d3.create("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .style("font-family", "sans-serif");

  wrapper.appendChild(svg.node());

  const tooltip = document.createElement("div");
  Object.assign(tooltip.style, {
    position: "absolute",
    background: "#fff",
    border: "1px solid #ccc",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "13px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    pointerEvents: "none",
    visibility: "hidden",
    lineHeight: "1.5",
    zIndex: 10
  });
  wrapper.appendChild(tooltip);

  const svgG = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  categoryGroupLifespans.sort((a, b) => a.start - b.start);

  const x = d3.scaleLinear().domain([1927, 2024]).range([0, width]);
  const y = d3.scaleBand().domain(categoryGroupLifespans.map(d => d.category)).range([0, height]).padding(0.25);
  const statusColor = d3.scaleOrdinal().domain(["active", "inactive"]).range(["#3cb371", "#ccc"]);

  // Axes
  svgG.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svgG.append("g")
    .call(d3.axisLeft(y));

  // Bars
  svgG.selectAll("rect")
    .data(categoryGroupLifespans)
    .join("rect")
    .attr("x", d => x(d.start))
    .attr("y", d => y(d.category))
    .attr("width", d => x(d.end) - x(d.start))
    .attr("height", y.bandwidth())
    .attr("fill", d => d.end === 2024 ? statusColor("active") : statusColor("inactive"))
    .attr("rx", 4)
    .attr("ry", 4)
    .on("mouseover", (event, d) => {
      tooltip.innerHTML = `
        <strong>Category:</strong> ${d.category}<br>
        <strong>Group:</strong> ${d.group}<br>
        <strong>Years Active:</strong> ${d.start} – ${d.end}<br>
        <strong>Status:</strong> ${d.end === 2024 ? "Active" : "Inactive"}<br>
        <strong>Lifespan:</strong> ${d.end - d.start} years
      `;
      tooltip.style.visibility = "visible";
    })
    .on("mousemove", event => {
      tooltip.style.top = `${event.pageY - 30}px`;
      tooltip.style.left = `${event.pageX + 10}px`;
    })
    .on("mouseout", () => {
      tooltip.style.visibility = "hidden";
    });

  // Title
  svg.append("text")
    .attr("x", margin.left + width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text("Lifespan of Oscar Categories Over Time");

  // Legend on the right side
  const legend = svg.append("g")
    .attr("transform", `translate(${margin.left + width + 20},${margin.top})`);

  const legendItems = ["active", "inactive"];
  legend.selectAll("rect")
    .data(legendItems)
    .join("rect")
    .attr("y", (d, i) => i * 24)
    .attr("width", 14)
    .attr("height", 14)
    .attr("fill", d => statusColor(d));

  legend.selectAll("text")
    .data(legendItems)
    .join("text")
    .attr("x", 20)
    .attr("y", (d, i) => i * 24 + 11)
    .attr("font-size", "13px")
    .text(d => d.charAt(0).toUpperCase() + d.slice(1));

  return wrapper;
}


function _dashboard(html){return(
html`
  <div id="dashboard" style="display: flex; flex-direction: column; gap: 30px; font-family: sans-serif;">
    <div id="chart-column" style="display: flex; flex-direction: column; gap: 30px; width: 100%;"></div>
  </div>
`
)}

function _53($0,$1)
{
  const bipartite = $0;
  const timeline = $1;

  const column = document.getElementById("chart-column");
  column.innerHTML = "";

  bipartite.style.width = "100%";
  timeline.style.width = "100%";

  column.appendChild(bipartite);
  column.appendChild(timeline);

  return document.getElementById("dashboard");
}


export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["imdb_genres.csv", {url: new URL("./files/e16ac98e2a51e834a764b7d4cf5f738cd06ca8a8b5f41553db51f789097a000a7da8c1c6f694b1ff5b632df3b91ab42dd008c62c7bae5779e1bf5412f3b2ea38.csv", import.meta.url), mimeType: "text/csv", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["md"], _2);
  main.variable(observer()).define(["md"], _3);
  main.variable(observer()).define(["md"], _4);
  main.variable(observer()).define(["md"], _5);
  main.variable(observer()).define(["md"], _6);
  main.variable(observer()).define(["md"], _7);
  main.variable(observer("d3")).define("d3", ["require"], _d3);
  main.variable(observer("oscarsData")).define("oscarsData", ["d3"], _oscarsData);
  main.variable(observer("actingData")).define("actingData", ["oscarsData"], _actingData);
  main.variable(observer("directingDatatask1")).define("directingDatatask1", ["oscarsData"], _directingDatatask1);
  main.variable(observer("filmDirectorMap")).define("filmDirectorMap", ["directingDatatask1"], _filmDirectorMap);
  main.variable(observer("directorActorPairs")).define("directorActorPairs", ["actingData","filmDirectorMap"], _directorActorPairs);
  main.variable(observer("collaborationStats")).define("collaborationStats", ["directingDatatask1"], _collaborationStats);
  main.variable(observer("filteredCollabs1")).define("filteredCollabs1", ["collaborationStats"], _filteredCollabs1);
  main.variable(observer("actorDirectorWins")).define("actorDirectorWins", ["oscarsData"], _actorDirectorWins);
  main.variable(observer("radialData")).define("radialData", ["actorDirectorWins"], _radialData);
  main.variable(observer("viewof radialNetwork1")).define("viewof radialNetwork1", ["d3","actorDirectorWins"], _radialNetwork1);
  main.variable(observer("radialNetwork1")).define("radialNetwork1", ["Generators", "viewof radialNetwork1"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], _19);
  main.variable(observer("imdbGenres")).define("imdbGenres", ["FileAttachment"], _imdbGenres);
  main.variable(observer("oscarsWithGenres")).define("oscarsWithGenres", ["oscarsData","imdbGenres"], _oscarsWithGenres);
  main.variable(observer("oscarsExpandedGenres")).define("oscarsExpandedGenres", ["oscarsWithGenres"], _oscarsExpandedGenres);
  main.variable(observer("genreCategoryMatrix")).define("genreCategoryMatrix", ["d3","oscarsExpandedGenres"], _genreCategoryMatrix);
  main.variable(observer("viewof genreCategoryHeatmap")).define("viewof genreCategoryHeatmap", ["d3","genreCategoryMatrix","DOM"], _genreCategoryHeatmap);
  main.variable(observer("genreCategoryHeatmap")).define("genreCategoryHeatmap", ["Generators", "viewof genreCategoryHeatmap"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], _25);
  main.variable(observer("actorDirectorGenreData")).define("actorDirectorGenreData", ["actorDirectorWins","oscarsExpandedGenres"], _actorDirectorGenreData);
  main.variable(observer("bipartiteData")).define("bipartiteData", ["actorDirectorGenreData"], _bipartiteData);
  main.variable(observer("viewof bipartiteOscars")).define("viewof bipartiteOscars", ["d3","bipartiteData","actorDirectorGenreData","updateTimelineHighlight","clearTimelineHighlight"], _bipartiteOscars);
  main.variable(observer("bipartiteOscars")).define("bipartiteOscars", ["Generators", "viewof bipartiteOscars"], (G, _) => G.input(_));
  main.variable(observer()).define(["md"], _29);
  main.variable(observer("directingData")).define("directingData", ["oscarsData"], _directingData);
  main.variable(observer()).define(["directingData"], _31);
  main.variable(observer("parsedDirectingData")).define("parsedDirectingData", ["directingData"], _parsedDirectingData);
  main.variable(observer()).define(["d3","parsedDirectingData"], _33);
  main.variable(observer("topDirectingData")).define("topDirectingData", ["d3","parsedDirectingData"], _topDirectingData);
  main.variable(observer("directorTimelineData")).define("directorTimelineData", ["d3","parsedDirectingData"], _directorTimelineData);
  main.variable(observer("viewof selectedDirector")).define("viewof selectedDirector", ["Inputs","topDirectingData"], _selectedDirector);
  main.variable(observer("selectedDirector")).define("selectedDirector", ["Generators", "viewof selectedDirector"], (G, _) => G.input(_));
  main.variable(observer("bipartiteDirectorSet")).define("bipartiteDirectorSet", ["bipartiteData"], _bipartiteDirectorSet);
  main.variable(observer("filteredDirectingData")).define("filteredDirectingData", ["directorTimelineData","bipartiteDirectorSet"], _filteredDirectingData);
  main.variable(observer("filteredDirectingDataold")).define("filteredDirectingDataold", ["topDirectingData","selectedDirector"], _filteredDirectingDataold);
  main.variable(observer("viewof directorTimelinewithAllDirectors")).define("viewof directorTimelinewithAllDirectors", ["topDirectingData","Inputs","html","filteredDirectingDataold","d3"], _directorTimelinewithAllDirectors);
  main.variable(observer("directorTimelinewithAllDirectors")).define("directorTimelinewithAllDirectors", ["Generators", "viewof directorTimelinewithAllDirectors"], (G, _) => G.input(_));
  main.variable(observer("viewof directorTimeline1")).define("viewof directorTimeline1", ["d3","directorTimelineData","filteredDirectingData","CSS"], _directorTimeline1);
  main.variable(observer("directorTimeline1")).define("directorTimeline1", ["Generators", "viewof directorTimeline1"], (G, _) => G.input(_));
  main.variable(observer("updateTimelineHighlight")).define("updateTimelineHighlight", ["d3"], _updateTimelineHighlight);
  main.variable(observer("clearTimelineHighlight")).define("clearTimelineHighlight", ["d3"], _clearTimelineHighlight);
  main.variable(observer()).define(["bipartiteData"], _44);
  main.variable(observer()).define(["filteredDirectingData"], _45);
  main.variable(observer()).define(["bipartiteData","directorTimelineData"], _46);
  main.variable(observer()).define(["md"], _47);
  main.variable(observer("categoryLifespans")).define("categoryLifespans", ["d3","oscarsData"], _categoryLifespans);
  main.variable(observer("oscarsGroupedCategories")).define("oscarsGroupedCategories", ["oscarsData"], _oscarsGroupedCategories);
  main.variable(observer("categoryGroupLifespans")).define("categoryGroupLifespans", ["d3","oscarsGroupedCategories"], _categoryGroupLifespans);
  main.variable(observer("viewof enhancedCategoryTimeline")).define("viewof enhancedCategoryTimeline", ["categoryGroupLifespans","d3"], _enhancedCategoryTimeline);
  main.variable(observer("enhancedCategoryTimeline")).define("enhancedCategoryTimeline", ["Generators", "viewof enhancedCategoryTimeline"], (G, _) => G.input(_));
  main.variable(observer("viewof dashboard")).define("viewof dashboard", ["html"], _dashboard);
  main.variable(observer("dashboard")).define("dashboard", ["Generators", "viewof dashboard"], (G, _) => G.input(_));
  main.variable(observer()).define(["viewof bipartiteOscars","viewof directorTimeline1"], _53);
  return main;
}
