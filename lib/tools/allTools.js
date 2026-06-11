import { getAdapters } from "./getAdapters.js"
import { getRunningInstances } from "./getInstances.js"
import { search } from "./search.js"
import { getState } from "./getState.js"
import { setState } from "./setState.js"
import { getStatesWithValues } from "./getStatesWithValues.js"  
import { describe } from "./describe.js"
import { anotate } from "./anotate.js"
import { setStateBulk } from "./setStateBulk.js"
import { createState } from "./createState.js"
import { createScene } from "./createScene.js"
import { setObject } from "./setObject.js"
import { searchDB } from "./searchDB.js"
import { getAllRooms } from "./getAllRooms.js"
import { getAllObjectsInRoom } from "./getAllObjectsInRoom.js"
import { getHistory } from "./getHistory.js"
import { describeBulk } from "./describeBulk.js"
import { deleteItemFromIndex } from "./deleteItemFromIndex.js"
import { getObject } from "./getObject.js"
import { getStateBulk } from "./getStateBulk.js"
import { get } from "node:http"
export const Tools = {
    getAdapters,
    getRunningInstances,
    getState,
    setState,
    getStateBulk,
    getStatesWithValues,
    describe,
    anotate,
    setStateBulk,
    createState,
    createScene,
    setObject,
    getObject,
    searchDB,
    getAllRooms,
    getAllObjectsInRoom,
    getHistory,
    search,
    describeBulk,
    deleteItemFromIndex
    // Add other tools here as needed
}