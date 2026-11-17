/*
 * Copyright (c) 2024.  Botts Innovative Research, Inc.
 * All Rights Reserved
 */

import {
    Box,
    Button,
    Card,
    Checkbox,
    Container,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
    Snackbar,
    SnackbarCloseReason,
    Stack,
    TextField,
    Typography
} from "@mui/material";
import React, {useEffect, useState} from "react";
import {addNode, selectNodes, updateNode} from "@/lib/state/OSHSlice";
import {INode, Node, NodeAuthenticationMode, NodeOptions} from "@/lib/data/osh/Node";
import {useAppDispatch} from "@/lib/state/Hooks";
import {useSelector} from "react-redux";
import {useLanguage} from "@/app/contexts/LanguageContext";


export default function NodeForm({isEditNode, modeChangeCallback, editNode}: {
    isEditNode: boolean,
    modeChangeCallback?: (editMode: boolean, editNode: INode | null) => void
    editNode?: INode
}) {

    const [openSnack, setOpenSnack] = useState(false);
    const [nodeSnackMsg, setNodeSnackMsg] = useState("");
    const [colorStatus, setColorStatus] = useState("");
    const [showSecret, setShowSecret] = useState(false);

    const dispatch = useAppDispatch();
    const nodes = useSelector(selectNodes);
    const { t } = useLanguage();

    const newNodeOpts: NodeOptions = {
        name: "",
        address: "localhost",
        port: 8282,
        oshPathRoot: "/sensorhub",
        csAPIEndpoint: "/api",
        auth: {username: "", password: "", token: ""},
        authenticationMode: "session",
        isSecure: false,
        isDefaultNode: false
    };
    const [newNode, setNewNode] = useState<INode>(new Node(newNodeOpts));

    useEffect(() => {
        if (isEditNode && editNode) {
            setNewNode(editNode);
        } else {
            const node = new Node(newNodeOpts);
            setNewNode(node);
        }
    }, [isEditNode, editNode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value, checked} = e.target;

        let tNode = new Node({...newNode, id: newNode.id, auth: {...newNode.auth}});
        if (name === "username") {
            tNode.auth.username = value;
        } else if (name === "password") {
            tNode.auth.password = value;
        } else if (name === "token") {
            tNode.auth.token = value;
        } else if (name === "isSecure") {
            tNode.isSecure = checked;
        } else if (name === "port") {
            tNode.port = Number.parseInt(value) || (tNode.isSecure ? 443 : 80);
        } else if (name === 'address'){
            tNode.address = value;
        } else if (name === "name") {
            tNode.name = value;
            tNode.customNameSet = Boolean(value && value.trim() !== "" && value.trim() !== "Local Node");
        } else{
            (tNode as any)[name] = value;
        }

        setNewNode(tNode);
    };

    const handleAuthModeChange = (e: SelectChangeEvent<string>) => {
        const nextMode = e.target.value as NodeAuthenticationMode;
        const tNode = new Node({
            ...newNode,
            id: newNode.id,
            authenticationMode: nextMode,
            auth: {...newNode.auth},
        });
        setNewNode(tNode);
    };

    const handleButtonAction = async (e: React.FormEvent, nodeToSave: INode = newNode) => {
        e.preventDefault();

        const trimmedName = (nodeToSave.name || "").trim();
        if (!trimmedName) {
            nodeToSave.name = nodeToSave.serverNodeName || nodeToSave.address;
        } else {
            nodeToSave.name = trimmedName;
        }
        nodeToSave.customNameSet = Boolean(nodeToSave.name && nodeToSave.name !== "Local Node");

        if (isEditNode) {
            const nameCollision = nodes.some(
                (n: INode) => n.id !== nodeToSave.id && n.name === nodeToSave.name,
            );
            if (nameCollision) {
                setNodeSnackMsg(t('nodeNameExists', {name: nodeToSave.name}));
                setColorStatus('error');
                setOpenSnack(true);
                return;
            }
            dispatch(updateNode(nodeToSave));
            modeChangeCallback(false, null);
        } else {
            const hasDuplicate = nodes.some(
                (n: INode) => n.address === nodeToSave.address && n.port === nodeToSave.port
            );
            if (hasDuplicate) {
                setNodeSnackMsg(t('nodeAddressExists', {address: nodeToSave.address, port: nodeToSave.port}));
                setColorStatus('error');
                setOpenSnack(true);
                return;
            }
            const nameExists = nodes.some((n: INode) => n.name === nodeToSave.name);
            if (nameExists) {
                setNodeSnackMsg(t('nodeNameExists', {name: nodeToSave.name}));
                setColorStatus('error');
                setOpenSnack(true);
                return;
            }

            dispatch(addNode(nodeToSave));
            setNodeSnackMsg(t('nodeAdded', {name: nodeToSave.name}));
            setColorStatus('success');
            setOpenSnack(true);
            modeChangeCallback(false, null);
        }
    }

    const handleAddSave = async(e: React.FormEvent)=> {

        let reachable = await checkReachable(newNode)
        setOpenSnack(true)

        if(!reachable){
            setNodeSnackMsg(t('nodeNotReachable'))
            setColorStatus('error')
            setOpenSnack(true);
            return;
        }

        setNodeSnackMsg(t('nodeReachable'))
        setColorStatus('success')
        setOpenSnack(true);

        const nodeToSave = new Node({...newNode, id: newNode.id, auth: {...newNode.auth}});
        if (nodeToSave.authenticationMode === "session")
            nodeToSave.clearRuntimeCredentials();

        // Session-capable nodes retain only their opaque HttpOnly cookie. Federation-token
        // and Basic-only nodes retain credentials in memory until the tab is closed, never in localStorage.
        handleButtonAction(e, nodeToSave);
    }

    if (!newNode) {
        return <Container><Typography variant="h4" align="center">{t('loading')}</Typography></Container>
    }

    const handleCloseSnack = (
        event: React.SyntheticEvent | Event,
        reason?: SnackbarCloseReason,
    ) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpenSnack(false);
    };

    async function checkReachable(node: any){
        setNodeSnackMsg(t('tryingToConnect'))
        setColorStatus('info')
        setOpenSnack(true)


        const endpoint = `${node.getConnectedSystemsEndpoint()}`;

        const options: RequestInit = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...node.getBasicAuthHeader()
            },
            mode: 'cors',
            credentials: 'include',
        }

        try {
            const response = await fetch(endpoint, options);
            if (response.ok) {
                try {
                    const sysRes = await fetch(`${endpoint}/systems?format=application%2Fjson`, options);
                    if (sysRes.ok) {
                        const sysJson = await sysRes.json();
                        const items = Array.isArray(sysJson?.items) ? sysJson.items : [];
                        const oscarSystems = items.filter((item: any) =>
                            String(item?.uid || item?.properties?.uid || "").includes("urn:ornl:oscar:system:"),
                        );
                        oscarSystems.sort((a: any, b: any) => {
                            const va = String(a?.validTime?.[0] || a?.properties?.validTime?.[0] || "");
                            const vb = String(b?.validTime?.[0] || b?.properties?.validTime?.[0] || "");
                            return vb.localeCompare(va);
                        });
                        const oscarSys = oscarSystems[0];
                        if (oscarSys) {
                            const uid = String(oscarSys?.uid || oscarSys?.properties?.uid || "").trim();
                            const rawName = String(oscarSys?.name || oscarSys?.properties?.name || "").trim();
                            if (uid) node.serverNodeUid = uid;
                            if (rawName && rawName !== "OSCAR System") {
                                node.serverNodeName = rawName;
                            }
                        }
                    }
                } catch {
                    // Best-effort remote node metadata lookup
                }
                setNodeSnackMsg(t('connectedToServer', {address: node.address}));
                setColorStatus('success')
                return true;
            }else{
                setNodeSnackMsg(t('serverUnreachable', {address: node.address}));
                setColorStatus('error')
                return false;
            }

        } catch (error) {
            setNodeSnackMsg(t('connectionFailedCheckServer'));
            setColorStatus('error')
            return false;
        }
    }

    return (
        <Card sx={{width: '100%'}}>
            <Typography
                variant="h4"
                align="left"
                sx={{margin: 2}}
            >
                {
                    isEditNode ? t('editNode')  : t('addServer')
                }
            </Typography>

            <Box component="form" sx={{margin: 2}}>
                <Stack spacing={3}>
                    {isEditNode ? <Typography variant={"h6"}>{t('editingNode', {id: editNode.id})}</Typography> : null}
                    <TextField label={t('name')} name="name" value={newNode.name} onChange={handleChange}/>
                    <TextField label={t('address')} name="address" value={newNode.address} onChange={handleChange}/>
                    <TextField label={t('port')} name="port" value={newNode.port} onChange={handleChange}/>
                    <TextField
                        label={t('csApiEndpoint')}
                        name="csAPIEndpoint"
                        value={newNode.csAPIEndpoint}
                        onChange={handleChange}
                    />

                    <FormControl fullWidth>
                        <InputLabel id="node-auth-mode-label">{t('nodeAuthMethod')}</InputLabel>
                        <Select
                            labelId="node-auth-mode-label"
                            label={t('nodeAuthMethod')}
                            value={newNode.authenticationMode}
                            onChange={handleAuthModeChange}
                        >
                            <MenuItem value="session">{t('nodeAuthSession')}</MenuItem>
                            <MenuItem value="bearer">{t('nodeAuthFederationToken')}</MenuItem>
                            <MenuItem value="basic">{t('basicOnlyNode')}</MenuItem>
                        </Select>
                    </FormControl>

                    {newNode.authenticationMode === "bearer" ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                            <TextField
                                fullWidth
                                label={t('federationTokenLabel')}
                                name="token"
                                type={showSecret ? "text" : "password"}
                                placeholder="oscar_fed_..."
                                value={newNode.auth.token || ""}
                                onChange={handleChange}
                                inputProps={{
                                    spellCheck: false,
                                    autoCorrect: "off",
                                    autoCapitalize: "none",
                                }}
                            />
                            <Button
                                type="button"
                                variant="outlined"
                                aria-pressed={showSecret}
                                onClick={() => setShowSecret((prev) => !prev)}
                                sx={{flexShrink: 0, height: 56}}
                            >
                                {showSecret ? t('hideSecret') : t('showSecret')}
                            </Button>
                        </Stack>
                    ) : (
                        <>
                            <TextField
                                label={t('username')}
                                name="username"
                                value={newNode.auth.username}
                                onChange={handleChange}
                                inputProps={{
                                    spellCheck: false,
                                    autoCorrect: "off",
                                    autoCapitalize: "none",
                                }}
                            />
                            <Stack direction="row" spacing={1} alignItems="center">
                                <TextField
                                    fullWidth
                                    label={t('password')}
                                    name="password"
                                    type={showSecret ? "text" : "password"}
                                    value={newNode.auth.password}
                                    onChange={handleChange}
                                    inputProps={{
                                        spellCheck: false,
                                        autoCorrect: "off",
                                        autoCapitalize: "none",
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outlined"
                                    aria-pressed={showSecret}
                                    onClick={() => setShowSecret((prev) => !prev)}
                                    sx={{flexShrink: 0, height: 56}}
                                >
                                    {showSecret ? t('hideSecret') : t('showSecret')}
                                </Button>
                            </Stack>
                        </>
                    )}

                    <FormControlLabel control={<Checkbox name="isSecure" checked={newNode.isSecure} onChange={handleChange}/>} label={t('isSecure')}/>
                    <Typography variant="body2" color="text.secondary">
                        {t('passwordStorageNotice')}
                    </Typography>

                    <Stack direction="row" spacing={2}>
                        <Button variant={"contained"} color={"primary"}
                                onClick={handleAddSave}>{isEditNode ? t('saveChanges') : t('addNode')}</Button>
                        <Button variant={"outlined"} color={"secondary"}
                                onClick={() => modeChangeCallback(false, null)}>{t('cancel')}</Button>
                    </Stack>


                    <Snackbar
                        id="saveNode-snackbar"
                        open={openSnack}
                        anchorOrigin={{ vertical:'top', horizontal:'center' }}
                        autoHideDuration={5000}
                        onClose={handleCloseSnack}
                        message={nodeSnackMsg}
                        sx={{
                            '& .MuiSnackbarContent-root': {
                                backgroundColor: colorStatus === 'success' ? 'green' : colorStatus === 'error' ? 'red' : 'orange',
                            },
                        }}
                    />

                </Stack>
            </Box>
        </Card>
    )
}
