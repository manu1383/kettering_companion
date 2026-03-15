import { useState } from "react";

export function useContainedImageLayout() {
    const [containerSize, setContainerSize] = useState({
        width: 0,
        height: 0,
    });

    const [imageSize, setImageSize] = useState({
        width: 1,
        height: 1,
    });

    const aspectRatio = imageSize.width / imageSize.height;

    const { width, height } = containerSize;

    let displayWidth = width;
    let displayHeight = height;
    let offsetX = 0;
    let offsetY = 0;

    if (width && height) {
        if (width / height > aspectRatio) 
        {
            displayWidth = height * aspectRatio;
            offsetX = (width - displayWidth) / 2;
        } 
        else 
        {
            displayHeight = width / aspectRatio;
            offsetY = (height - displayHeight) / 2;
        }
    }

    return {
        onContainerLayout: (e: any) =>
            setContainerSize({
                width: e.nativeEvent.layout.width,
                height: e.nativeEvent.layout.height,
            }),

        onImageLoad: (event: any) => {
            const { width, height } = event.source;
            if (width && height) {
                setImageSize({ width, height });
            }
        },

        imageStyle: {
            width: displayWidth,
            height: displayHeight,
            position: "absolute" as const,
            left: offsetX,
            top: offsetY,
        },

        displayWidth,
        displayHeight,
        offsetX,
        offsetY,
    };
} 