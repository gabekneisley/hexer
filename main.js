/*
https://www.omnicalculator.com/math/hexagon#:~:text=Inradius%3A%20the%20radius%20of%20a,%E2%88%9A3%2F2%20%C3%97%20a%20.
inradius and apothem
side length equals outer circle radius, R
center to edge length (apothem) equals ((sq root of 3)/2)*R
inner circle radius is the apothem

To get R from inner circle radius, r, (half of edge to edge), do:
R = ((sq root of 3)/2) / r
*/

function svgElem(tag, props={}) {
  const SVG = "http://www.w3.org/2000/svg";
  const elem = document.createElementNS(SVG, tag);
  for (const [key, value] of Object.entries(props)) {
    elem.setAttribute(key, value);
  }
  return elem;
}

function letterByIndex(i) {
  const SERIES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  let lbl = '';
  let flr = Math.floor((i+1)/26);
  let mod = (i+1) % 26;
  if(!mod && flr) {
    flr -=1;
  }
  if(flr) {
    lbl += SERIES[flr-1];
  }
  if(mod === 0) {
    mod = 26;
  }
  lbl += SERIES[mod-1];
  return lbl;
}
function indexFromLetter(col) {
  const SERIES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const letters = col.split('');
  const rpos = SERIES.indexOf(letters.pop());
  if(letters.length) {
    return 26 * (SERIES.indexOf(letters[0]) +1) + rpos;
  }
  else {
    return rpos;
  }
}
function letterMinus(col) {
  const i = indexFromLetter(col);
  if(i > 0) {
    return letterByIndex(i-1);
  }
}
function letterPlus(col) {
  const i = indexFromLetter(col);
  return letterByIndex(i+1);
}
function splitId(id) {
  const [rawCol, rawRow] = /([A-Z]+)(\d+)/.exec(id).slice(1,3);
  return [rawCol, rawRow];
}

function hexAround(r, cx, cy, round=true) {
  const a = 2 * Math.PI / 6;
  const points = [];
  let x,y;
  for (let i = 0; i < 6; i++) {
    x = cx + r * Math.cos(a * i);
    y = cy + r * Math.sin(a * i);
    if(round) {
      x = Math.round(x);
      y = Math.round(y);
    }
    points.push([x,y]);
  }
  return points;
}

class Hexer {
  container = document.getElementById('hexer_container');
  canvas = document.getElementById('canvas');
  imageHeight = 0;
  imageWidth = 0;

  placeImage(src) {
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.addEventListener("load", () => {
      this.imageWidth = img.naturalWidth;
      this.imageHeight = img.naturalHeight;
      this.canvas.width = img.naturalWidth;
      this.canvas.height = img.naturalHeight;
      this.canvasWidth = img.naturalWidth;
      this.canvasHeight = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      this.mapLoaded();
    }, false);
    img.src = src;
  }

  mapLoaded() {
    this.drawGrid(100);
  }

  drawGrid(d) {
    this.grid = new HexGrid(d, this.canvas.width, this.canvas.height);
  }
}

class HexGrid {
  a = 2 * Math.PI / 6;
  mapContainer = document.getElementById('map_container');
  colHeaders = document.getElementById('col_labels');
  rowHeaders = document.getElementById('row_labels');
  colCount = 0;
  rowCount = 0;

  constructor(d, cw, ch, opts) {
    this.options = opts;
    this.d = d;
    this.canvasWidth = cw;
    this.canvasHeight = ch;
    this.r = Math.round(this.d/2);
    this.edgeLength = Math.round(this.d * Math.cos(this.a));
    this.hexHeight = Math.round(this.d * Math.sin(this.a));
    // horizontal offset is the same as spacer size
    this.spacerSize = Math.round((this.d - this.edgeLength) / 2);

    this.style = document.createElement('style');
    this.style.id = 'grid_styles';
    document.head.appendChild(this.style);

    this.hexes = {};
    this.inhabitedHex;

    this.drawHeaders();
    this.getPoints();
    this.makeGrid();

    this.addStyle('#COL_HDR_A', ['font-weight: bold;']);
  }

  neighborsOf(id) {
    const [rawCol, rawRow] = splitId(id);
    const col = indexFromLetter(rawCol);
    const row = parseInt(rawRow);
    const colLeft = 0;
    const rowTop = 1;
    const colRight = this.colCount-1;
    const rowBottom = this.rowCount+1;
    const neighbors = {};
    //N
    if(row > rowTop) {
      neighbors['N'] = `${rawCol}${row-1}`;
    }
    // NE
    if(col < colRight && row > rowTop) {
      let outCol = letterByIndex(col+1);
      let outRow = col % 2 === 0? row : row-1;
      neighbors['NE'] = `${outCol}${outRow}`;
    }
    // SE
    if(row < rowBottom && col < colRight) {
      let outCol = letterByIndex(col+1);
      let outRow = col % 2 === 0? row+1 : row;
      neighbors['SE'] = `${outCol}${outRow}`;
    }
    // S
    if(row < rowBottom) {
      neighbors['S'] = `${rawCol}${row+1}`;
    }
    // SW
    if(row < rowBottom && col > colLeft) {
      let outCol = letterByIndex(col-1);
      let outRow = col % 2 === 0? row+1 : row;
      neighbors['SW'] = `${outCol}${outRow}`;
    }
    // NW
    if(col > colLeft && row > rowTop) {
      let outCol = letterByIndex(col-1);
      let outRow = col % 2 === 0? row : row-1;
      neighbors['NW'] = `${outCol}${outRow}`;
    }
    return neighbors;
  }

  addStyle(selector, directives) {
    let styleText = `${selector} { `;
    styleText += directives.map(
      (directive) => `${directive}`
    ).join(' ');
    styleText += ' }';
    this.style.innerHTML += styleText;
  }

  makeHeader(placement, id, label) {
    const hdr = document.createElement('li');
    if(id) {
      hdr.id = id;
    }
    if(label) {
      hdr.appendChild(document.createTextNode(label));
    }
    if(placement == 'corner') {
      hdr.classList.add('corner');
    }
    else if(placement == 'col') {
      hdr.classList.add('col');
    }
    else if(placement == 'hspacer') {
      hdr.classList.add('hspacer');
    }
    else if(placement == 'row') {
      hdr.classList.add('row');
    }
    return hdr;
  }

  drawHeaders() {
    this.colHeaders.appendChild(
      this.makeHeader('corner', '', ''));
    let xAxisWidth = 0;
    let xAxisIndex = 0;
    let yAxisHeight = 0;
    while(xAxisWidth < this.canvasWidth) {
      let isSpacer = !!(xAxisIndex % 2)
      let plc = isSpacer ? 'hspacer' : 'col';
      let li;
      xAxisIndex += 1;
      if(isSpacer) {
        li = this.makeHeader(plc, '', '');
        xAxisWidth += this.spacerSize;
      }
      else {
        let letter = letterByIndex(this.colCount);
        li = this.makeHeader(plc, 'COL_HDR_'+letter, letter);
        xAxisWidth += this.edgeLength;
        this.colCount += 1;
        li.addEventListener("mouseover", this.highlightCol.bind(this, letter));
        li.addEventListener("mouseout", this.unHighlightCol.bind(this, letter));
      }
      this.colHeaders.appendChild(li);
    }
    while(yAxisHeight < this.canvasHeight) {
      this.rowCount += 1;
      let li = this.makeHeader('row', 
        'ROW_HDR_'+this.rowCount, this.rowCount);
      yAxisHeight += this.hexHeight;
      li.addEventListener("mouseover", this.highlightRow.bind(this, this.rowCount));
      li.addEventListener("mouseout", this.unHighlightRow.bind(this, this.rowCount));
      this.rowHeaders.appendChild(li);
    }
    this.addStyle('#row_labels li.row', 
      [`height: ${this.hexHeight}px;`]);
    this.addStyle('#col_labels li.col', 
      [`width: ${this.edgeLength}px;`]);
    this.addStyle('#col_labels li.hspacer', 
      [`width: ${this.spacerSize}px;`]);
  }

  getCenterPoints() {
    this.centers = {};
    const vOffset = Math.round(
      this.edgeLength - this.r - (this.r * Math.sin(this.a))
    );
    let cx = this.spacerSize;
    let cy = this.hexHeight/2;
    for(let i = 0; i < this.rowCount+1; i++) {
      for(let j = 0; j < this.colCount; j++) {
        let id = letterByIndex(j) + (i+1);
        this.centers[id] = [cx, cy];
        //move right
        cx += this.spacerSize + this.r;
        // alternate up or down.
        let absRowOffset = this.hexHeight / 2;
        // if j is odd now, go down (add)
        cy += (j%2) ? absRowOffset : -absRowOffset;
      }
      // reset the row
      cx = this.spacerSize;
      // alternate new y depending on col count
      cy += (this.colCount %2) ? this.hexHeight/2 : this.hexHeight;
    }
  }

  getPoints() {
    this.points = {};
    const vOffset = Math.round(
      this.edgeLength - this.r - (this.r * Math.sin(this.a))
    );
    let cx = this.spacerSize;
    let cy = this.hexHeight/2;
    for(let i = 0; i < this.rowCount+1; i++) {
      for(let j = 0; j < this.colCount; j++) {
        let id = letterByIndex(j) + (i+1);
        this.points[id] = {
          'center': [cx, cy],
          'vertices': hexAround(this.r, cx, cy)
        }
        //move right
        cx += this.spacerSize + this.r;
        // alternate up or down.
        let absRowOffset = this.hexHeight / 2;
        // if j is odd now, go down (add)
        cy += (j%2) ? absRowOffset : -absRowOffset;
      }
      // reset the row
      cx = this.spacerSize;
      // alternate new y depending on col count
      cy += (this.colCount %2) ? this.hexHeight/2 : this.hexHeight;
    }
  }

  headersFromId(id) {
    const [rawCol, rawRow] = splitId(id);
    const colId = 'COL_HDR_'+rawCol;
    const rowId = 'ROW_HDR_'+rawRow;
    return [
      document.getElementById(colId),
      document.getElementById(rowId)
    ];
  }

  highlightHeaders(id) {
    for(const elem of this.headersFromId(id)) {
      elem.classList.add('highlight');
    }
  }
  unHighlightHeaders(id) {
    for(const elem of this.headersFromId(id)) {
      elem.classList.remove('highlight');
    }
  }
  getHexRow(num) {
    const rowContents = [];
    for(const [id, hex] of Object.entries(this.hexes)) {
      const [rawCol, rawRow] = splitId(id);
      if(parseInt(rawRow) == num) {
        rowContents.push(hex);
      }
    }
    return rowContents;
  }
  getHexCol(ltr) {
    const colContents = [];
    for(const [id, hex] of Object.entries(this.hexes)) {
      const [rawCol, rawRow] = splitId(id);
      if(rawCol == ltr) {
        colContents.push(hex);
      }
    }
    return colContents;
  }
  highlightRow(num, e) {
    for(const hex of this.getHexRow(num)) {
      hex.highlight();
    }
  }
  unHighlightRow(num, e) {
    for(const hex of this.getHexRow(num)) {
      hex.unHighlight();
    }
  }
  highlightCol(ltr, e) {
    for(const hex of this.getHexCol(ltr)) {
      hex.highlight();
    }
  }
  unHighlightCol(ltr, e) {
    for(const hex of this.getHexCol(ltr)) {
      hex.unHighlight();
    }
  }
  reduceNeighborOpacity(id) {
    for(const [d, nid] of Object.entries(this.neighborsOf(id))) {
      const hex = this.hexes[nid];
      hex.reduceOpacity();
    }
  }

  makeLattice() {

  }

  makeGrid() {
    const grid = svgElem('svg', {
      id: 'grid_overlay',
      width: this.canvasWidth,
      height: this.canvasHeight
    });
    this.svgContainer = grid;
    for(const id in this.points) {
      const [cx, cy] = this.points[id].center;
      const hex = new Hex(this, this.r, cx, cy, id);
      this.hexes[id] = hex;
      hex.render()
    }
    this.mapContainer.appendChild(grid);
  }
}
/*
UI Options
Move To
Reveal
<path d="M5,0C2.2,0,0,2.2,0,5c0,2.8,4.5,10,5,10c0.5,0,5-7.2,5-10C10,2.2,7.8,0,5,0z M5,7.5C3.6,7.5,2.5,6.4,2.5,5S3.6,2.5,5,2.5
    S7.5,3.6,7.5,5S6.4,7.5,5,7.5z"/>
*/
class Hex {
  pointsText = '';
  a = 2 * Math.PI / 6;
  OPACITY_VALUES = {
    obscured: 'hex-obscured',
    slight: 'hex-revealed-slight',
    mid: 'hex-revealed-mid',
    revealed: 'hex-revealed'
  }

  constructor(gridParent, r, cx, cy, id) {
    this.gridParent = gridParent;
    this.svgContainer = this.gridParent.svgContainer;
    this.r = r;
    this.cx = cx;
    this.cy = cy;
    this.id = id;
    this.points = hexAround(this.r, this.cx, this.cy);
    this.pointsText = this.points.map((p) => p.join(',')).join(' ');
    this.polygon = this.makePolygon({
      class: 'hex',
      id: this.id
    });
    this.group = svgElem('g');
    this.group.addEventListener("mouseenter", this.mouseenter.bind(this));
    this.group.addEventListener("mouseleave", this.mouseleave.bind(this));
    this.group.addEventListener("click", this.click.bind(this));
    this.group.addEventListener("dblclick", this.dblclick.bind(this));
    this.group.appendChild(this.polygon);
    this.opacity = 'obscured';
    this.inhabited = false;
    // make the UI
    this.travelIcon = svgElem('path', {
      d: `M8,0C3.6,0,0,3.6,0,8c0,4.4,7.2,16,8,16c0.8,0,8-11.6,8-16C16,3.6,12.4,0,8,0z M8,12c-2.2,0-4-1.8-4-4s1.8-4,4-4s4,1.8,4,4
    S10.2,12,8,12z`,
      transform: `translate(${this.cx - 8}, ${this.cy + 10})`,
      class: 'travel-icon hidden',
      id: this.id + '_travel_icon'
    });
    this.travelIcon.addEventListener("click", this.travelHere.bind(this));
    this.group.appendChild(this.travelIcon);
  }

  render() {
    this.svgContainer.appendChild(this.group);
  }

  travelHere(e) {
    // reveal the space
    this.reveal();
    // lighten neighbors
    this.gridParent.reduceNeighborOpacity(this.id);
    // set inhabited
    if(this.gridParent.inhabitedHex) {
      this.gridParent.inhabitedHex.leaveHere();
    }
    this.gridParent.inhabitedHex = this;
    this.inhabitedPolygon = this.makePolygon({
      class: 'hex-inhabited',
      id: this.id+'_inhabited_highlight'
    });
    this.svgContainer.appendChild(this.inhabitedPolygon);
    this.inhabited = true;
  }
  leaveHere() {
    this.svgContainer.removeChild(this.inhabitedPolygon);
  }

  mouseenter(e) {
    // make a new hovering polygon with the same points as this one.
    // send an event to the col and row headers to highlight.
    // show any UI.
    this.showUI();
    this.gridParent.highlightHeaders(this.id);
  }

  mouseleave(e) {
    this.hideUI();
    this.gridParent.unHighlightHeaders(this.id);
  }

  click(e) {
    if(this.opacity == 'revealed' && !this.inhabited) {
      this.obscure();
    }
    else {
      this.reduceOpacity();
    }
  }

  dblclick(e) {
    this.reveal();
  }

  highlight() {
    this.polygon.classList.add('highlight');
  }
  unHighlight() {
    this.polygon.classList.remove('highlight');
  }

  setOpacity(val) {
    for (const [name, className] of Object.entries(this.OPACITY_VALUES)) {
      this.polygon.classList.remove(className);
    }
    this.opacity = val;
    this.polygon.classList.add(this.OPACITY_VALUES[val]);
  }

  reduceOpacity() {
    if(this.opacity == 'obscured') {
      this.setOpacity('slight');
    }
    else if(this.opacity == 'slight') {
      this.setOpacity('mid');
    }
    else if(this.opacity == 'mid') {
      this.setOpacity('revealed');
    }
  }

  obscure() {
    this.setOpacity('obscured');
  }
  reveal() {
    this.setOpacity('revealed');
  }

  showUI() {
    this.travelIcon.classList.remove('hidden');
  }
  hideUI() {
    this.travelIcon.classList.add('hidden');
  }

  makePolygon(props) {
    return svgElem('polygon', Object.assign({
      points: this.pointsText
    }, props));
  }
}

function init() {
  hexer = new Hexer;
  hexer.placeImage("lair_search.jpg");
}
init();