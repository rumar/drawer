import { v4 as uuid } from "uuid";
import coordinates from "./faker/coordinates";

function drawer({
  width = 1000,
  height = 562,
  colors = {
    main: "rgba(224, 7, 49, 0.5)",
    hover: "rgba(20, 152, 8, 0.5)",
  },
  isAdmin = false,
} = {}) {
  let canvas = null;
  let drawButton = null;
  let removeButton = null;

  let config = {
    /**
     * @type String
     * @value "edit" | "draw"
     */
    mode: "edit",
    /**
     * @type Array
     * @value {new fabric.Circle}[]
     */
    drawingPoints: [],
    /**
     * @type Array
     * @value {new fabric.Line}[]
     */
    drawingLines: [],
  };

  initCanvas();

  function initCanvas() {
    const wrapper = document.querySelector(".drawer .canvas-wr");
    const canvasElement = document.createElement("canvas");

    wrapper.appendChild(canvasElement);
    canvas = window._canvas = new fabric.Canvas(canvasElement);
    canvas.setWidth(width);
    canvas.setHeight(height);
    initPolygons();
    createButtons();
    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);
  }

  function createButtons() {
    drawButton = document.createElement("button");
    drawButton.type = "button";
    drawButton.innerHTML = "Add polygon";

    removeButton = document.createElement("button");
    removeButton.innerHTML = "Remove polygon";
    removeButton.type = "button";

    document.querySelector(".drawer .controls").appendChild(drawButton);
    document.querySelector(".drawer .controls").appendChild(removeButton);
    document
      .querySelector(".drawer .controls")
      .querySelector("input[type=file]").style.display = "none";
  }

  function resizeCanvas() {
    const outerCanvasContainer = document.querySelector("#img");

    const ratio = canvas.getWidth() / canvas.getHeight();
    const containerWidth = outerCanvasContainer.clientWidth;
    const containerHeight = outerCanvasContainer.clientHeight;

    const scale = containerWidth / canvas.getWidth();
    const zoom = canvas.getZoom() * scale;
    canvas.setDimensions({
      width: containerWidth,
      height: containerHeight,
    });
    canvas.setViewportTransform([zoom, 0, 0, zoom, 0, 0]);
  }

  drawButton.addEventListener("click", () => {
    config.mode = "draw";
    console.log(canvas.getActiveObject());
  });

  removeButton.addEventListener("click", () => {
    canvas.remove(canvas.getActiveObject());
  });

  function initPolygons() {
    if (!coordinates || !coordinates.length) return;

    coordinates.forEach((points) => {
      const polygon = createPolygon(points);
      canvas.add(polygon);
    });
  }

  /**
   *
   * @param {array} points - [{x, y}] array of objects with coordinates
   * @returns new fabric.Polygon object
   */
  function createPolygon(points) {
    return new fabric.Polygon(points, {
      fill: colors.main,
      strokeWidth: 1,
      stroke: colors.main,
      objectCaching: false,
      transparentCorners: false,
      cornerSize: 10,
      cornerStyle: "circle",
      cornerColor: "blue",
      perPixelTargetFind: true,
      lockMovementX: !isAdmin,
      lockMovementY: !isAdmin,
      controls: !isAdmin
        ? false
        : points.reduce(function (acc, point, index) {
            var lastControl = points.length - 1;
            acc["p" + index] = new fabric.Control({
              positionHandler: polygonPositionHandler,
              actionHandler: anchorWrapper(
                index > 0 ? index - 1 : lastControl,
                actionHandler
              ),
              actionName: "modifyPolygon",
              pointIndex: index,
            });
            return acc;
          }, {}),
      hasBorders: false,
    });
  }

  /**
   *
   * @param {number} x - coordinate on x-axis
   * @param {number} y - coordinate on y-axis
   * @returns new fabric.Circle object
   */
  function createCircle(x, y) {
    return new fabric.Circle({
      radius: 5 / canvas.getZoom(),
      fill: "blue",
      left: x / canvas.getZoom(),
      top: y / canvas.getZoom(),
      originX: "center",
      originY: "center",
      selectable: false,
      hasControls: false,
      selectable: false,
      uuid: uuid(),
    });
  }

  /**
   *
   * @param {array} points - [x1, y1, x2, y2]
   * @returns new fabric.Line object
   */
  function createLine(points) {
    return new fabric.Line(points, {
      strokeWidth: 1,
      fill: "#999999",
      stroke: "#999999",
      class: "line",
      originX: "center",
      originY: "center",
      selectable: false,
      // hasBorders: false,
      hasControls: false,
      evented: false,
    });
  }

  function closePolygonPath() {
    const points = config.drawingPoints.map((circle) => ({
      x: circle.left,
      y: circle.top,
    }));
    const polygon = createPolygon(points);
    config.drawingPoints.forEach((circle) => {
      canvas.remove(circle);
    });
    config.drawingLines.forEach((line) => {
      canvas.remove(line);
    });
    config.drawingPoints = [];
    config.drawingLines = [];
    canvas.add(polygon);
  }

  function selectObjectHandler(options) {
    console.log(options);
  }

  canvas.on("selection:created", selectObjectHandler);
  canvas.on("selection:updated", selectObjectHandler);

  canvas.on("mouse:down", function (options) {
    // console.log("click", options);
    if (
      options.target &&
      options.target.uuid &&
      options.target.uuid === config.drawingPoints[0].uuid
    ) {
      config.mode = "edit";
      closePolygonPath();
    }

    if (config.mode === "draw") {
      const circle = createCircle(options.pointer.x, options.pointer.y);
      if (config.drawingPoints.length === 0) {
        circle.set({
          fill: "red",
        });
      }
      config.drawingPoints.push(circle);

      if (config.drawingPoints.length > 1) {
        const length = config.drawingPoints.length;
        const points = [
          config.drawingPoints[length - 1].left,
          config.drawingPoints[length - 1].top,
          config.drawingPoints[length - 2].left,
          config.drawingPoints[length - 2].top,
        ];
        const line = createLine(points);
        config.drawingLines.push(line);
        canvas.add(line);
      }
      canvas.add(circle);
    }
  });

  // canvas.on("mouse:move", function (options) {
  // console.log("move", options);
  // });

  canvas.on("mouse:over", function (e) {
    if (!e.target) return;

    if (e.target.type === "polygon") {
      e.target.set("fill", colors.hover);
      e.target.set("stroke", colors.hover);
      canvas.renderAll();
    }
  });

  canvas.on("mouse:out", function (e) {
    if (!e.target) return;

    if (e.target.type === "polygon") {
      e.target.set("fill", colors.main);
      e.target.set("stroke", colors.main);
      canvas.renderAll();
    }
  });

  // // define a function that can keep the polygon in the same position when we change its
  // // width/height/top/left.
  function anchorWrapper(anchorIndex, fn) {
    return function (eventData, transform, x, y) {
      var fabricObject = transform.target,
        absolutePoint = fabric.util.transformPoint(
          {
            x: fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x,
            y: fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y,
          },
          fabricObject.calcTransformMatrix()
        ),
        actionPerformed = fn(eventData, transform, x, y),
        newDim = fabricObject._setPositionDimensions({}),
        polygonBaseSize = getObjectSizeWithStroke(fabricObject),
        newX =
          (fabricObject.points[anchorIndex].x - fabricObject.pathOffset.x) /
          polygonBaseSize.x,
        newY =
          (fabricObject.points[anchorIndex].y - fabricObject.pathOffset.y) /
          polygonBaseSize.y;
      fabricObject.setPositionByOrigin(absolutePoint, newX + 0.5, newY + 0.5);
      return actionPerformed;
    };
  }

  function getObjectSizeWithStroke(object) {
    var stroke = new fabric.Point(
      object.strokeUniform ? 1 / object.scaleX : 1,
      object.strokeUniform ? 1 / object.scaleY : 1
    ).multiply(object.strokeWidth);
    return new fabric.Point(object.width + stroke.x, object.height + stroke.y);
  }

  // // define a function that can locate the controls.
  // // this function will be used both for drawing and for interaction.
  function polygonPositionHandler(dim, finalMatrix, fabricObject) {
    var x = fabricObject.points[this.pointIndex].x - fabricObject.pathOffset.x,
      y = fabricObject.points[this.pointIndex].y - fabricObject.pathOffset.y;
    return fabric.util.transformPoint(
      { x: x, y: y },
      fabric.util.multiplyTransformMatrices(
        fabricObject.canvas.viewportTransform,
        fabricObject.calcTransformMatrix()
      )
    );
  }

  // // define a function that will define what the control does
  // // this function will be called on every mouse move after a control has been
  // // clicked and is being dragged.
  // // The function receive as argument the mouse event, the current trasnform object
  // // and the current position in canvas coordinate
  // // transform.target is a reference to the current object being transformed,
  function actionHandler(eventData, transform, x, y) {
    var polygon = transform.target,
      currentControl = polygon.controls[polygon.__corner],
      mouseLocalPosition = polygon.toLocalPoint(
        new fabric.Point(x, y),
        "center",
        "center"
      ),
      polygonBaseSize = getObjectSizeWithStroke(polygon),
      size = polygon._getTransformedDimensions(0, 0),
      finalPointPosition = {
        x:
          (mouseLocalPosition.x * polygonBaseSize.x) / size.x +
          polygon.pathOffset.x,
        y:
          (mouseLocalPosition.y * polygonBaseSize.y) / size.y +
          polygon.pathOffset.y,
      };
    polygon.points[currentControl.pointIndex] = finalPointPosition;
    return true;
  }

  return {
    getData() {
      const res = canvas.getObjects("polygon").map((item) => item.points);
      console.log(res);
    },
  };
}

export { drawer };
