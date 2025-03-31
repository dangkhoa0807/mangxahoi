import mitt from "mitt";

const emitter = mitt();

export const useEvent = emitter.emit;
export const useListen = emitter.on;
export const removeListen = emitter.off;
