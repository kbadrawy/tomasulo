    import * as React from 'react';
    import Box from '@mui/material/Box';
    import Container from '@mui/material/Container';
    import Paper from '@mui/material/Paper';
    import CssBaseline from '@mui/material/CssBaseline';
    import Typography from '@mui/material/Typography';
    import { createTheme, ThemeProvider } from '@mui/material/styles';
    import Collapse from '@mui/material/Collapse';
    import IconButton from '@mui/material/IconButton';
    import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
    import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
    import NavigationIcon from '@mui/icons-material/Navigation';

    import { useState, useEffect,useRef } from 'react';
    import {
    styled,
    Table,
    TableBody,
    TableCell,
    tableCellClasses,
    TableContainer,
    TableHead,
    TableRow
    } from "@mui/material";
    import { useLocation } from "react-router-dom";
    import {Fab} from "@material-ui/core";
    import * as THREE from "three";
    import NET from 'vanta/dist/vanta.fog.min'

    const StyledTableCell = styled(TableCell)(({ theme }) => ({

    [`&.${tableCellClasses.head}`]: {
        backgroundColor: theme.palette.common.black,
        color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
    },
    }));

    const StyledTableHead = styled(TableCell)(() => ({
    color: "#FFFFFF",
    // backgroundColor: theme.palette.common.black,
    backgroundColor: "#005b64",

    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
    },
    }));

    const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    // hide last border
    '&:last-child td, &:last-child th': {
        border: 0,
    },
    }));
    var instr=0;
    var doneCount =0; //number of done instructions

    function Anim() {
        
    const location = useLocation();
    const key = location.state;
    const theme = createTheme();
    const [main, setMain] = useState(key.Instructions);
    const [memory, setMemory] = useState({1:"1.5",2:"0.5",3:"1",4:"2.5",5:"3.2",6:"0",7:"5.5",8:"6",9:"12.75",10:"22.22"});



    //add: {Qj= 0, Qk= 0, Vj= 5,Vk=2 ,temp= 12, busy= 1, op="add",started= true, endTime = 4, idx= ""}
    const [add, setAdd] = useState(getInitialState("A"));

    //mul: {Qj= 0, Qk= 0, Vj= 5,Vk=2 ,temp= 10, busy= 1, op="mul",started= true, endTime = 4, idx:"" }
    const [mul, setMul] = useState(getInitialState("M"));

    const [load, setLoad] = useState(getInitialStateLoad());
    // store :{tag:"S1" ,Address:"", V:"", Q:"", busy:1, started: false, temp:"",idx: ""}
    const [store, setStore] = useState(getInitialStateStore);

    // reg: [{Qi= , val= }]
    const [reg, setReg] = useState(getInitialStateReg());

    const latency=key.latency;
    // //console.log("here")
    const [cycleFront, setCycleFront] = useState(0);
    const [cont, setCont] = useState(main.length!==0);
    // let inst=0;//user
    //user
    let cycle=0;
    const [vantaEffect, setVantaEffect] = useState(0);
        const myRef = useRef(null);
        useEffect(() => {
            if(cycleFront===0 && main.length!==0)
            doCycle();
            if (!vantaEffect) {
                setVantaEffect(NET({
                    el: myRef.current,
                    THREE: THREE,
                    mouseControls: true,
                    touchControls: true,
                    gyroControls: false,
                    minHeight: 3000.00,
                    minWidth: 200.00,
                    highlightColor: 0x5ed885,
                    midtoneColor: 0xe988e9,
                    lowlightColor: 0x80ff,
                    baseColor: 0xf6f6f6,
                    speed: 1.5
                }))
            }
            return () => {
                if (vantaEffect) vantaEffect.destroy();
            }
        }, [vantaEffect])
   

    function getInitialStateStore() {
        let res = [];
        for (let i = 1; i <= 3; i++) {
            res.push({ tag: "S" + i, Address: "", V: "", Q: "", busy: "", started: false, idx: "" });
        }
        return res;
        // return [{tag:"S1" ,Address:3, V:4, Q:"", busy:1, started: false, idx:2}]

    }
    function getInitialStateReg() {
        let res = [];
        for (let i = 0; i < 32; i++) {
            res.push({ tag: "F" + i, Qi: "", val: "" });
        }
        return res;
    }

    function getInitialState(a) {
        return [
            {tag: a+"1",op:"",Vj:"",Vk:"",Qj:"",Qk:"", busy: "", idx: "",started: false,temp:""},
            {tag: a+"2",op:"",Vj:"",Vk:"",Qj:"",Qk:"", busy: "", idx: "",started: false,temp:""},
            {tag: a+"3",op:"",Vj:"",Vk:"",Qj:"",Qk:"", busy: "", idx: "",started: false,temp:""},
            ];
        // return [{ tag: "A1", Qj: "", Qk: "", Vj: 5, Vk: 22, temp: 27, busy: 1, op: "add", started: true, idx: 0 },
        // { tag: "A2", Qj: "", Qk: "A1", Vj: 5, Vk: "", temp: "", busy: 0, op: "add", started: false, idx: 1 }];
        // return [{tag:"M1",op:"mul", Vj:5, Vk:2 ,Qj: "", Qk:"", busy: 1,  idx:2,started: false, temp:""}]
    }
    function getInitialStateLoad() {
        return [{ tag: "L1", Address: "", busy: "", idx: "", started: false, temp: "" },
        { tag: "L2", Address: "", busy: "", idx: "", started: false, temp: "" },
        { tag: "L3", Address: "", busy: "", idx: "", started: false, temp: "" }];
        // return [{tag: "L1", Address: 2, busy: 1, idx: 3,started: false,temp:""}]
    }
    function doCycle() {
        cycle=cycleFront+1;
            setCycleFront(cycleFront + 1);
        startExecution();
        issue();
        //delay
        writeResult();
        //delay
        endExecution();
        //delay

    }
    function issue(){
        //console.log(" instr to issue:",instr)
        if(instr===main.length){
            return;
        }
        let main2=main;
        const inst= main2[instr];
        const stationidx =type(inst.Instruction);
        const tagIdx = stationAvailable(stationidx);

        if(tagIdx!==-1){
            putInStation(inst.Instruction , stationidx , tagIdx); // we will put the instruction in the reservation station
            inst.Issue=cycle;
            main2[instr]=inst;
            setMain(main2);
            instr=instr+1; // next time we will fetch the instruction after
            //console.log(instr," instNo")
        }
        // instruction=stringToInstruction(inst gdeeda)
        // stationType=type(instruction)
        // if(stationAvailable(stationType))
        // {
        //    putInStation(instruction,stationType)
        // }

    }
    function loopOnStore() {
        // store: [ {tag:"S1" ,Address:3, V:4, Q:"", busy:1, started: false, temp:""}]

        //console.log("store")
        //console.log(store)

        let store2 = store;
        let main2 = main;

        for (let i = 0; i < store.length; i++) {
            const inst = store[i]
            if (inst.busy === 1 && !inst.started && inst.V !== "") {

                //console.log("will do store ")
                //console.log(store[i])

                store2[i].started = true;

                main2[store[i].idx].ExecStart = cycle

                exec(main2[store[i].idx].Instruction, inst.Address, inst.V)
            }
        }

        setStore(store2);
        setMain(main2);
        //console.log("main after store")
        //console.log(main)
        //console.log("store after change")
        //console.log(store)
    }
    function loopOnLoad() {
        //console.log("load")
        //console.log(load)

        let load2=load;
        let main2=main;

        for(let i=0;i<load.length;i++){
            const inst=load[i]
            if(inst.busy===1 && !inst.started && inst.V!=="")
            {

                    //console.log("will do load ")
                    //console.log(load[i])

                load2[i].started=true;

                main2[load[i].idx].ExecStart=cycle
                load2[i].temp=exec(main2[load[i].idx].Instruction,inst.Address,inst.V)
                //console.log("loaded")

                console.log(load2)
            }
        }

        setLoad(load2);
        setMain(main2);
        //console.log("main after load")
        //console.log(main)
        //console.log("load after change")
        //console.log(load2)
    }
    function loopOnAdd() {

        // add: [{tag=A1, Qj= 0, Qk= 0, Vj= 5,Vk=2 ,temp= null, busy= 1, op="add",started= true, endTime =4 }]

        //console.log("add" + add)
        let add2 = add;
        let main2 = main;

        for (let i = 0; i < add.length; i++) {
            const inst = add[i]
            if (inst.busy === 1 && inst.Qk === "" && inst.Qj === "" && !inst.started) {

                //console.log("will execute" ,Object.values(add2[i]))

                add2[i].started = true;

                //console.log("main2[idx]",main2[add[i].idx], " :idx",add[i].idx);

                main2[add[i].idx].ExecStart = cycle

                add2[i].temp = exec(main2[add[i].idx].Instruction, add2[i].Vj, add2[i].Vk)
            }
        }

        setAdd(add2);
        setMain(main2);
        //console.log("main after change" + main)
        //console.log("add after change" + add)

    }
    function loopOnMul(){

        // mul: [{tag=M1, Qj= 0, Qk= 0, Vj= 5,Vk=2 ,temp= null, busy= 1, op="mul",started= true, endTime =4 }]
        //console.log("dakhal")
        //console.log("mul"+mul)
        let mul2=mul;
        let main2=main;

        for(let i=0;i<mul.length;i++){
            const inst=mul[i]
            if(inst.busy===1 && inst.Qk==="" && inst.Qj==="" && !inst.started)
            {

                // console.log("will execute ", (mul2[i]))

                mul2[i].started=true;
                main2[mul[i].idx].ExecStart = cycle
                mul2[i].temp = exec(main2[mul[i].idx].Instruction,mul2[i].Vj,mul2[i].Vk)
            }
        }
        setMul(mul2);
        setMain(main2);

        //console.log("main")
        //console.log(main)
        //console.log("mul after change")
        //console.log(mul)
    }
    function endExecution() {
        let main2 = main;

        for (let i = 0; i < main.length; i++) {
            const inst = main2[i]
            if (inst.ExecStart !== "") {
                if (inst.ExecEnd === "") {

                    let op = inst.Instruction.substring(0, 3).toLowerCase();
                    if(op[0]==='l')op="ld";
                    // console.log("latency  ",latency[op] ,"  .....    ", op, " cycle ", cycle , "Execstart ", inst.ExecStart);
                    if (Number(latency[op]) + inst.ExecStart - 1 === cycle) {
                        main2[i].ExecEnd=cycle;
                    }

                }
            }
        }setMain(main2);
    }
    //iman
    //{Instruction="MUL, R1, R2, R3", Issue=1, ExecStart=2, ExecEnd=5, WB=6,tag=M1}
    //{{tag=M1,op=,...,idx=0},{},{}}
    function writeResult() {
        //1st check if any inst is done excuting but haven't WB yet 
        //I need to go/loop in order 3shan if conflict -> FIFO

        //after finding an inst that wants to WB 
        /* loop over reg file, add and mul res stations, any tag replace w instruction o/p
        free up res station -> busy = 0 - maybe remove the inst in front end? wla next cycle?
        write curr cycle in big table
            */

        //console.log("in WB method");
        //console.log("load" , load);
        const waiting = main.filter(inst => inst.WB === "" && inst.ExecEnd !== "");
        //console.log(waiting);
        if (waiting.length > 0) {
            var output;
            var myIndex;
            let add3,mul3,load3,store3;
            const curr = waiting[0]; //the inst that'll WB dlw2ty
            switch (curr.tag) {
                case "A1":
                    output = add[0].temp;
                    myIndex = add[0].idx;
                    add3 =add;
                    add3[0] = { tag: "A1", Qj: "", Qk: "", Vj: "", Vk: "", temp: "", busy: "", op: "", started: false, idx: "" };
                    setAdd(add3);
                    break;
                case "A2":
                    output = add[1].temp;
                    myIndex = add[1].idx;
                    add3 =add;
                    add3[1] = { tag: "A2", Qj: "", Qk: "", Vj: "", Vk: "", temp: "", busy: "", op: "", started: false, idx: "" };
                    setAdd(add3);
                    break;
                case "A3":
                    output = add[2].temp;
                    myIndex = add[2].idx;
                    add3 =add;
                    add3[2] = { tag: "A3", Qj: "", Qk: "", Vj: "", Vk: "", temp: "", busy: "", op: "", started: false, idx: "" };
                    setAdd(add3);
                    break;
                case "M1":
                    output = mul[0].temp;
                    myIndex = mul[0].idx;
                    mul3 =mul;
                    mul3[0] = { tag: "M1", Qj: "", Qk: "", Vj: "", Vk: "", temp: "", busy: "", op: "", started: false, idx: "" };
                    setMul(mul3);
                    break;
                case "M2":
                    output = mul[1].temp;
                    myIndex = mul[1].idx;
                    mul3 =mul;
                    mul3[1] = { tag: "M2", Qj: "", Qk: "", Vj: "", Vk: "", temp: "", busy: "", op: "", started: false, idx: "" };
                    setMul(mul3);
                    break;
                case "M3":
                    output = mul[2].temp;
                    myIndex = mul[2].idx;
                    mul3 =mul;
                    mul3[2] = { tag: "M3", Qj: "", Qk: "", Vj: "", Vk: "", temp: "", busy: "", op: "", started: false, idx: "" };
                    setMul(mul3);
                    break;
                case "L1":
                    output = load[0].temp;
                    myIndex = load[0].idx;
                    load3 = load;
                    load3[0] = { tag: "L1", Address: "", busy: "", idx: "", started: false, temp: "" };
                    setLoad(load3);
                    break;
                case "L2":
                    output = load[1].temp;
                    myIndex = load[1].idx;
                    load3 = load;
                    load3[1] = { tag: "L2", Address: "", busy: "", idx: "", started: false, temp: "" };
                    setLoad(load3);
                    break;
                case "L3":
                    output = load[2].temp;
                    myIndex = load[2].idx;
                    load3 = load;
                    load3[2] = { tag: "L3", Address: "", busy: "", idx: "", started: false, temp: "" };
                    setLoad(load3);
                    break;
                case "S1":
                    output = store[0].temp;
                    myIndex = store[0].idx;
                    store3 = store;
                    store3[0] = { tag: "S1", Address: "", busy: "", idx: "", started: false, temp: "",V:"",Q:"" };
                    setStore(store3);
                    break;
                case "S2":
                    output = store[1].temp;
                    myIndex = store[1].idx;
                    store3 = store;
                    store3[1] = { tag: "S2", Address: "", busy: "", idx: "", started: false, temp: "" ,V:"",Q:""};
                    setStore(store3);
                    break;
                case "S3":
                    output = store[2].temp;
                    myIndex = store[2].idx;
                    store3 = store;
                    store3[2] = { tag: "S3", Address: "", busy: "", idx: "", started: false, temp: "",V:"",Q:"" };
                    setStore(store3);
                    break;
            }
            //console.log("output",output);

            //update ADD
            //console.log("add", add)
            let add2 = add;

            for (let i = 0; i < add.length; i++) {
                const inst = add[i]
                if (inst.Qk === curr.tag) {
                    add2[i].Qk = "";
                    add2[i].Vk = output;
                }
                if (inst.Qj === curr.tag) {
                    add2[i].Qj = "";
                    add2[i].Vj = output;
                }
            }
            setAdd(add2);
            //console.log("add after change", add)

            //update MUL
            let mul2 = mul;
            for (let i = 0; i < mul.length; i++) {
                const inst = mul[i]
                if (inst.Qk === curr.tag) {
                    mul2[i].Qk = "";
                    mul2[i].Vk = output;
                }
                if (inst.Qj === curr.tag) {

                    mul2[i].Qj = "";
                    mul2[i].Vj = output;
                }
            }
            setMul(mul2);
            //console.log("mul after change")
            //console.log(mul)

            //update REG
            let reg2 = reg; //tag Qi val
            for (let i = 0; i < reg.length; i++) {
                const inst = reg[i]
                if (inst.Qi === curr.tag) {
                    reg2[i].Qi = "";
                    reg2[i].val = output;
                }
            }
            setReg(reg2);
            //console.log("reg after change")
            //console.log(reg)

            //update STORE
            let store2 = store;
            for (let i = 0; i < store.length; i++) {
                const inst = store[i]
                if (inst.Q === curr.tag) {
                    store2[i].Q = "";
                    store2[i].V = output;
                }
            }
            setStore(store2);
            //console.log("store after change")
            //console.log(store)
            //update MAIN
            let main2 = main;
            main2[myIndex].WB = cycle
            setMain(main2);
            //console.log("main after change")
            // console.log(main)
            doneCount++;
            console.log(doneCount);
            if(doneCount === main.length) //if i'm done w my program
                setCont(false);
        }
    }
    function MUL(n1, n2) { return Number(n1) * Number(n2) }
    function ADD(n1, n2) { return Number(n1) + Number(n2) }
    function DIV(n1, n2) { return Number(n1) / Number(n2) }
    function SUB(n1, n2) { return Number(n1) - Number(n2) }
    function LD(address) {console.log("address",address," mem[a]",memory[address]); return memory[address] }
    function STR(address, value) {
        //console.log("will change mem")
        let memory2 = memory;
        memory2[address] = value;
        setMemory(memory2);
        //console.log("memory after store")
        //console.log(memory)
    }
    function startExecution() {
        loopOnAdd()
        loopOnMul()
        loopOnLoad()
        loopOnStore()
    }
    function exec(s, Vj, Vk) {
        const inst = s.split(',');
        //console.log(inst[0])
        let X=inst[0].toLowerCase().trim();
        console.log("X",X ," length ",X.length)
        switch(X){
            case "add": return ADD(Vj,Vk)
            case "sub": return SUB(Vj,Vk)
            case "mul": return MUL(Vj,Vk)
            case "div": return DIV(Vj,Vk)
            case "str": return STR(Vj,Vk)
            case "ld":
                return LD(Vj)
        }


    }
    function type(instruction){
        const op= instruction.substring(0,3).toLowerCase();
        if(op==="add"|| op==="sub")return 1;
        if(op==="mul"|| op==="div")return 2;
        if(op==="str")return 3;
        return 4;
        // returns int 1 or 2 or 3 or 4 heya which type mn el talata: 1.(add/sub) 2.(mul/div) 3.(str) 4.ld
    }
    function stationAvailable(stationIdx){
        const station=stationIdx===1?add:stationIdx===2?mul:stationIdx===3?store:load;

        for(let i=0;i<station.length;i++){
            if(station[i].busy===""||station[i].busy===0){
                return i+1;
            }

        }
        return -1;
        // masalan law stationIdx=1: yb2a check el (add/sub), 
        // law stationIdx=2: yb2a check el (mul/div), 
        // law stationIdx=3: yb2a check el (ld/str)
        // returns boolean
    }
    function putInStation(instruction, stationIdx , tagIdx){
        //w update el tag bel station example: tag=M1
        //void
        if(stationIdx===3){ // store
            putInStore(instruction , tagIdx);
        }else if (stationIdx===4){ //load
            putInLoad(instruction , tagIdx);
        }else if (stationIdx===2){
            putInMul(instruction , tagIdx);
        }else{
            putInAdd(instruction , tagIdx);
        }
    }
    function getRegNo(register){ // takes as an input R123 return 123
        var arr = (register+"").split(" ");
        for (let i = 0; i < arr.length; i++) {
            if(arr[i]!=="")
                return arr[i].substring(1,arr[i].length);
        }
    }
    function putInAdd(instruction , tagIdx){
        // add: [{tag=A1, Qj= 0, Qk= 0, Vj= 5,Vk=2 ,temp= null, busy= 1, op="add",started= true, endTime =4 }]
        let add2=add;
        var tmp = instruction.split(",");
        let opcode = tmp[0].toLowerCase().trim();
        let a ={tag:"A"+tagIdx,op:opcode,Vj:"",Vk:"",Qj:"",Qk:"", busy: 1, idx: instr,started: false,temp:""}        // lets get the first reg
        const R1 = getRegNo(tmp[1].trim());
        const R2 = getRegNo(tmp[2].trim());
        const R3 = getRegNo(tmp[3].trim());
        //console.log(R1);
        //console.log(R2);
        //console.log(R3);
        // to set the Qj , Vk
        if(regReady(R2)){
            a.Vj=readReg(R2);
            if(a.Vj===""){
                a.Vj=0;
            }
            a.Qj="";
        }else {
            a.Qj=readReg(R2);
            a.Vj="";
        }
        if(regReady(R3)){
            a.Vk=readReg(R3);
            if(a.Vk===""){
                a.Vk=0;
            }
            a.Qk="";
        }else {
            a.Qk=readReg(R3);
            a.Vk="";
        }
        add2[tagIdx-1]=a;
        writeReg(R1,a.tag);
        let main2=main;
        let inst=main[instr];
        inst.tag=a.tag;
        main2[instr]=inst;
        setMain(main2);
        setAdd(add2);
    }
    function putInMul( instruction , tagIdx){
        let mul2=mul;
        var tmp = instruction.split(',');
        let opcode = tmp[0].toLowerCase().trim();

        let a ={tag:"M"+tagIdx,op:opcode,Vj:"",Vk:"",Qj:"",Qk:"", busy: 1, idx: instr,started: false,temp:""}
        // lets get the first reg
        const R1 = getRegNo(tmp[1].trim());
        const R2 = getRegNo(tmp[2].trim());
        const R3 = getRegNo(tmp[3].trim());

        // to set the Qj , Vk
        if(regReady(R2)){
            a.Vj=readReg(R2);
            if(a.Vj===""){
                a.Vj=0;
            }
            a.Qj="";
        }else {
            a.Qj=readReg(R2);
            a.Vj="";
        }
        if(regReady(R3)){
            a.Vk=readReg(R3);
            if(a.Vk===""){
                a.Vk=0;
            }
            a.Qk="";
        }else {
            a.Qk=readReg(R3);
            a.Vk="";
        }
        mul2[tagIdx-1]=a;
        writeReg(R1,a.tag);
        let main2=main;
        let inst=main[instr];
        inst.tag=a.tag;
        main2[instr]=inst;
        setMain(main2);
        setMul(mul2);
    }
    function putInStore(instruction , tagIdx){
        // store :{tag:"S1" ,Address:"", V:"", Q:"", busy:1, started: false, temp:"",idx: "",temp=""}
        let store2= store;
        var tmp = instruction.split(",");
        let s ={tag:"S"+tagIdx,Address:tmp[2],V:"",Q:"",busy:1,started: false, idx:instr};
        const R1 = getRegNo(tmp[1].trim());
        if(regReady(R1)){
            s.V=readReg(R1);
            if(s.V===""){
                s.V=0;
            }
            s.Q="";
        }else{
            s.V="";
            s.Q=readReg(R1);
        }
        store2[tagIdx-1]=s;
        let main2=main;
        let inst=main[instr];
        inst.tag=s.tag;
        main2[instr]=inst;
        setMain(main2);
        setStore(store2);
    }
    function putInLoad(instruction , tagIdx){
        let load2 = load;
        var tmp = instruction.split(',');
        let l ={tag: "L"+tagIdx, Address: tmp[2], busy:1, idx: instr,started: false,temp:""};
        load2[tagIdx-1]=l;
        writeReg(getRegNo(tmp[1].trim()),l.tag);
        let main2=main;
        let inst=main2[instr];
        inst.tag=l.tag;
        main2[instr]=inst;
        setMain(main2);
        setLoad(load2);
    }
    function regReady(register){
        const r = reg[Number(register)];
        // console.log(r);
        if(r.Qi===""||r.Qi===0)return true; // wa have the register value ready
        return false;
        //returns true register has val, false if no val yet (just tag)
        //always call this before calling readReg
    }
    function readReg(register){
        //returns value
        const r = reg[Number(register)];
        if(r.Qi===""||r.Qi===0)return r.val; // wa have the register value ready
        return r.Qi;
    }
    function writeReg(register , tag){
        let reg2=reg;
        const r = reg[Number(register)];
        r.Qi=tag;
        reg2[Number(register)]=r;
        setReg(reg2);
    }
    function InstructionsFront() {
        return (
            <TableContainer component={Paper}>
                <Table aria-label="customized table">
                    <TableHead>
            
                        <TableRow>
                            <StyledTableHead style={{color:"white"}}> </StyledTableHead>
                            <StyledTableHead style={{color:"white"}} align="left">Issue</StyledTableHead>
                            <StyledTableHead style={{color:"white"}} align="left">Execute</StyledTableHead>
                            <StyledTableHead style={{color:"white"}}  align="left">Write Result</StyledTableHead>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {main.map((row) => (
                            <StyledTableRow >
                                <StyledTableCell scope="row">
                                    {row.Instruction}
                                </StyledTableCell>
                                <StyledTableCell align="left">{row.Issue}</StyledTableCell>
                                {row.ExecStart!=="" &&
                                    <StyledTableCell align="left">{row.ExecStart} ... {row.ExecEnd}</StyledTableCell>}
                                {row.ExecStart==="" &&
                                    <StyledTableCell align="left"> </StyledTableCell>}
                                <StyledTableCell align="left">{row.WB}</StyledTableCell>

                            </StyledTableRow>))}
                    </TableBody>
                </Table>
            </TableContainer>
        )
    }
    function StatesFront(flag) {
        const table = flag==="add"?add:mul;
        const [open, setOpen] = React.useState(false);
        return(
            <TableContainer component={Paper}>
                <Table  aria-label="customized table">
                    <TableHead>
                        <TableRow>
                        <StyledTableHead>
                        <IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={() => setOpen(!open)}
                            style={{color:"white"}}
                            // color="white"
                        >
                            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}{flag.toUpperCase()}
                        </IconButton>
                                </StyledTableHead>
                            <StyledTableHead style={{color:"white"}} align="left">op</StyledTableHead>
                            <StyledTableHead style={{color:"white"}} align="left">Vj</StyledTableHead>
                            <StyledTableHead style={{color:"white"}} align="left">Vk</StyledTableHead>
                            <StyledTableHead style={{color:"white"}} align="left">Qj</StyledTableHead>
                            <StyledTableHead style={{color:"white"}} align="left">Qk</StyledTableHead>
                            <StyledTableHead style={{color:"white"}} align="left">busy</StyledTableHead>
                        </TableRow>
                    </TableHead>
                    <React.Fragment>
                        {open===true &&
                    <TableBody>
                    {/* <Collapse in={open} timeout="auto" unmountOnExit> */}
                        {table.map((row) => (
                            <StyledTableRow >
                                <StyledTableCell scope="row">
                                    {row.tag}
                                </StyledTableCell>
                                <StyledTableCell align="left">{row.op}</StyledTableCell>

                                <StyledTableCell align="left">{row.Vj}</StyledTableCell>
                                <StyledTableCell align="left">{row.Vk}</StyledTableCell>
                                <StyledTableCell align="left">{row.Qj}</StyledTableCell>
                                <StyledTableCell align="left">{row.Qk}</StyledTableCell>
                                <StyledTableCell align="left">{row.busy}</StyledTableCell>
                            </StyledTableRow>))}
                            {/* </Collapse> */}
                    </TableBody>
                        }
                    </React.Fragment>
                </Table>
            </TableContainer>
        )
    }
    function LoadFront() {
        const [open, setOpen] = React.useState(false);

        return(
            <TableContainer component={Paper}>
                <Table   aria-label="customized table">
                    <TableHead>
                        <TableRow>
                            <StyledTableHead><IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={() => setOpen(!open)}
                            style={{color:"white"}}
                            // color="white"
                        >
                            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}LOAD
                        </IconButton> </StyledTableHead>
                            <StyledTableHead style={{color:"white"}} align="left">Address</StyledTableHead>
                            <StyledTableHead style={{color:"white"}} align="left">busy</StyledTableHead>
                        </TableRow>
                    </TableHead>
                    {open===true &&

                    <TableBody>
                        {load.map((row) => (
                            <StyledTableRow >
                                <StyledTableCell scope="row">
                                    {row.tag}
                                </StyledTableCell>
                                <StyledTableCell align="left">{row.Address}</StyledTableCell>
                                <StyledTableCell align="left">{row.busy}</StyledTableCell>
                            </StyledTableRow>))}
                    </TableBody>
    }
                </Table>
            </TableContainer>
        )
    }
    function StoreFront() {
        const [open, setOpen] = React.useState(false);

        return(
            <TableContainer component={Paper}>
                <Table  aria-label="customized table">
                    <TableHead>
                        <TableRow>
                            <StyledTableHead>
                            <IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={() => setOpen(!open)}
                            style={{color:"white"}}
                            // color="white"
                        >
                            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}STORE
                        </IconButton> </StyledTableHead>
                            <StyledTableHead style={{color:"white"}} align="left">Address</StyledTableHead>
                            <StyledTableHead style={{color:"white"}} align="left">V</StyledTableHead>
                            <StyledTableHead style={{color:"white"}} align="left">Q</StyledTableHead>
                            <StyledTableHead style={{color:"white"}} align="left">busy</StyledTableHead>
                        </TableRow>
                    </TableHead>
                    {open===true &&

                    <TableBody>
                        {store.map((row) => (
                            <StyledTableRow >
                                <StyledTableCell scope="row">
                                    {row.tag}
                                </StyledTableCell>

                                <StyledTableCell align="left">{row.Address}</StyledTableCell>
                                <StyledTableCell align="left">{row.V}</StyledTableCell>
                                <StyledTableCell align="left">{row.Q}</StyledTableCell>
                                <StyledTableCell align="left">{row.busy}</StyledTableCell>
                            </StyledTableRow>))}
                    </TableBody>
    }
                </Table>
            </TableContainer>
        )
    }
    function RegFront() {
        const [open, setOpen] = React.useState(false);

        return(
            <TableContainer component={Paper}>
                <Table  aria-label="customized table">
                    <TableHead>
                        <TableRow>
                            <StyledTableHead> 
                            <IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={() => setOpen(!open)}
                            style={{color:"white"}}
                            // color="white"
                        >
                            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}REGs
                        </IconButton>
                            </StyledTableHead>
                            <StyledTableHead style={{color:"white"}} align="left">Qi</StyledTableHead>
                            <StyledTableHead style={{color:"white"}} align="left">Value</StyledTableHead>
                        </TableRow>
                    </TableHead>
                    {open===true &&

                    <TableBody>
                        {reg.map((row) => (
                            <StyledTableRow >
                                <StyledTableCell scope="row">
                                    {row.tag}
                                </StyledTableCell>

                                <StyledTableCell align="left">{row.Qi}</StyledTableCell>
                                <StyledTableCell align="left">{row.val}</StyledTableCell>
                            </StyledTableRow>))}
                    </TableBody>
    }
                </Table>
            </TableContainer>
        )
    }
    function MemFront() {
        let mem=Object.keys(memory);
        const [open, setOpen] = React.useState(false);

        return(
            <TableContainer component={Paper}>
                <Table  aria-label="customized table">
                    <TableHead>
                        <TableRow>
                        <StyledTableHead> 
                            <IconButton
                            aria-label="expand row"
                            size="small"
                            onClick={() => setOpen(!open)}
                            style={{color:"white"}}
                            // color="white"
                        >
                            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}Memory Address
                        </IconButton>
                            </StyledTableHead>
                            {/* <StyledTableHead style={{color:"white"}} align="left">Address</StyledTableHead> */}
                            <StyledTableHead style={{color:"white"}} align="left">Value</StyledTableHead>
                        </TableRow>
                    </TableHead>
                    {open===true &&

                    <TableBody>
                        { mem.map( (row) => (
                            <StyledTableRow >
                                
                                <StyledTableCell scope="row">
                                    {row}
                                </StyledTableCell>

                                <StyledTableCell align="left">{memory[row]}</StyledTableCell>
                            </StyledTableRow>))}
                    </TableBody>
    }
                </Table>
            </TableContainer>
        )
    }

    return (
      
            // className={classes.pageHeader}
            // style={{
            //     backgroundImage: "url(" + image + ")",
            //     backgroundSize: "cover",
            //     backgroundPosition: "top center",
            // }}
            
                <ThemeProvider theme={theme} >
                    <CssBaseline />
                    
                        <Paper variant="outlined" className='background' ref={myRef} sx={{ p: { xs: 2, md: 3 } }}>
                           <Container component="main" sx={{ mb: 4 }} >
                            <Typography component="h1" variant="h4" align="center">
                                Cycle : # {cycleFront}  {cont===false &&
                                <Typography component="h1" variant="h4" align="center"> Finished
                                </Typography>}
                            </Typography>
                            <React.Fragment>
                                {cont===true &&
                            <Box style={{position: "fixed" ,bottom: 0
                                ,right: 0,margin:20}} sx={{ display: 'flex', justifyContent: 'flex-end' ,position: "fixed" ,bottom: 0
                                ,right: 0}} >
                                <Fab onClick={() => {
                                    doCycle();
                                }} variant="extended" style={{backgroundColor: "#005b64",color:"white"}} >
                                    <NavigationIcon style={{ transform: 'rotate(90deg)'}} sx={{ mr: 1 }} />
                                    Next
                                </Fab>

                            </Box>}
                                <br/>
                            </React.Fragment>
                            <React.Fragment>
                                <React.Fragment>
                                    {InstructionsFront()}
                                    <br/><br/>
                                    {StatesFront("add")}<br/><br/>
                                    {StatesFront("mul")}<br/><br/>
                                    {LoadFront()}<br/><br/>
                                    {StoreFront()}<br/><br/>
                                    {RegFront()}<br/><br/>
                                    {MemFront()}
                                </React.Fragment>
                            </React.Fragment>
                                                </Container>

                        </Paper>

                </ThemeProvider>

    )
    }

    export default Anim;