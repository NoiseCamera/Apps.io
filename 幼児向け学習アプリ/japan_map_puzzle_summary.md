# Japan Map Puzzle Implementation

## Overview
We have created a new "Japan Map Puzzle" application (`japan-map-puzzle.html`) that uses SVG to render each prefecture as a puzzle piece.

## Features
-   **SVG-based Map**: Uses D3.js and TopoJSON to render a scalable, high-quality map of Japan.
-   **Draggable Pieces**: Each prefecture is an individual SVG element that can be dragged and dropped.
-   **Snap-to-Fit**: Pieces snap into their correct location on the map when dropped near the target.
-   **Region Filtering**: Users can filter pieces by region (Hokkaido/Tohoku, Kanto, etc.) to make the puzzle easier.
-   **Win Condition**: A "Complete!" modal appears when all pieces are placed.
-   **Toddler Friendly**: Uses the global design system (rounded fonts, bright colors, simple UI).

## Files Created
-   `japan-map-puzzle.html`: Main HTML file.
-   `japan-map-puzzle.css`: Styles for the map and pieces.
-   `japan-map-puzzle.js`: Game logic, data fetching, and D3 rendering.

## Data Source
The map data is fetched dynamically from:
`https://raw.githubusercontent.com/deldersveld/topojson/master/countries/japan/japan-prefectures.json`

## How to Play
1.  Open the app from the main menu ("にほんちず").
2.  Select a region (or "All").
3.  Drag the colored prefecture shapes from the bottom container onto the map outline.
4.  Complete the map to win stars!
