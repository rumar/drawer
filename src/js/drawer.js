import { v4 as uuid } from "uuid";

const coordinates = [
  [
    {
      x: 100,
      y: 100,
    },
    {
      x: 200,
      y: 200,
    },
    {
      x: 100,
      y: 300,
    },
  ],
  [
    {
      x: 500,
      y: 300,
    },
    {
      x: 700,
      y: 400,
    },
    {
      x: 400,
      y: 300,
    },
  ],
];

function drawer({ width = 1000, height = 560 } = {}) {
  const canvas = (window._canvas = new fabric.Canvas("canvas"));
  canvas.setWidth(width);
  canvas.setHeight(height);
  initPolygons();

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

  window.addEventListener("resize", resizeCanvas);

  const drawButton = document.getElementById("draw");
  const removeButton = document.getElementById("remove");

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

  drawButton.addEventListener("click", () => {
    config.mode = "draw";
    console.log(canvas.getActiveObject());
  });

  removeButton.addEventListener("click", () => {
    canvas.remove(canvas.getActiveObject());
  });

  function initPolygons() {
    if (!coordinates || !coordinates.length) return;

    coordinates.forEach((coord) => {
      const polygon = new fabric.Polygon(coord, {
        fill: "rgba(0,0,360,.5)",
        strokeWidth: 1,
        stroke: "black",
        objectCaching: false,
        transparentCorners: false,
        cornerSize: 10,
        cornerStyle: "circle",
        perPixelTargetFind: true,
        controls: coord.reduce(function (acc, point, index) {
          var lastControl = coord.length - 1;
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
      canvas.add(polygon);
    });
  }

  function genetatePoly() {
    const points = config.drawingPoints.map((circle) => ({
      x: circle.left,
      y: circle.top,
    }));
    const polygon = new fabric.Polygon(points, {
      fill: "rgba(0,0,360,.5)",
      strokeWidth: 1,
      stroke: "black",
      objectCaching: false,
      transparentCorners: false,
      cornerSize: 10,
      cornerStyle: "circle",
      perPixelTargetFind: true,
      controls: points.reduce(function (acc, point, index) {
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

  canvas.on("mouse:down", function (options) {
    console.log("click", options);
    if (
      options.target &&
      options.target.uuid &&
      options.target.uuid === config.drawingPoints[0].uuid
    ) {
      config.mode = "edit";
      genetatePoly();
    }

    if (config.mode === "draw") {
      const circle = new fabric.Circle({
        radius: 5 / canvas.getZoom(),
        fill: "green",
        left: options.pointer.x / canvas.getZoom(),
        top: options.pointer.y / canvas.getZoom(),
        originX: "center",
        originY: "center",
        selectable: false,
        hasControls: false,
        selectable: false,
        uuid: uuid(),
      });
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
        const line = new fabric.Line(points, {
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
        config.drawingLines.push(line);
        canvas.add(line);
      }
      canvas.add(circle);
      // canvas.renderAll();
    }
    // points.push(options.pointer);
    // canvas.renderAll();
  });

  canvas.on("mouse:move", function (options) {
    // console.log("move", options);
  });

  // canvas.on('mouse:over', function(e) {
  //   e.target.set('fill', 'red');
  //   canvas.renderAll();
  // });

  // canvas.on('mouse:out', function(e) {
  //   e.target.set('fill', 'green');
  //   canvas.renderAll();
  // });

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
      const res = canvas.getObjects('polygon').map(item => (item.points))
      console.log(res);
    }
  }
}

export { drawer };
