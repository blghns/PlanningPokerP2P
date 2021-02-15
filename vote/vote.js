(function () {

    let lastPeerId = null;
    let peer = null; // own peer object
    let conn = null;

    /**
     * Create the Peer object for our end of the connection.
     *
     * Sets up callbacks that handle any events related to our
     * peer object.
     */
    function initialize() {
        // Create own peer object with connection to shared PeerJS server
        peer = new Peer(null, {
            debug: 2
        });

        peer.on('open', function (id) {
            // Workaround for peer.reconnect deleting previous id
            if (peer.id === null) {
                console.log('Received null id from peer open');
                peer.id = lastPeerId;
            } else {
                lastPeerId = peer.id;
            }

            console.log('ID: ' + peer.id);
            joinToHost();
        });
        peer.on('connection', function (c) {
            // Disallow incoming connections
            c.on('open', function () {
                c.send("Sender does not accept incoming connections");
                setTimeout(function () {
                    c.close();
                }, 500);
            });
        });
        peer.on('disconnected', function () {
            console.log('Connection lost. Please reconnect');

            // Workaround for peer.reconnect deleting previous id
            peer.id = lastPeerId;
            peer._lastServerId = lastPeerId;
            peer.reconnect();
        });
        peer.on('close', function () {
            conn = null;
            console.log('Connection destroyed');
        });
        peer.on('error', function (err) {
            console.log(err);
            alert('' + err);
        });

        document.querySelector("#presentButton").addEventListener("click", () => {
            signal(selectInputs("present"));
        });

        document.querySelector("#voteButton").addEventListener("click", () => {
            signal(selectInputs("vote"));
        });
    }

    function selectInputs(type) {
        const username = document.querySelector("#username").value;
        const vote = document.querySelector("#vote").value;
        return { username, vote, type };
    }

    /**
     * Create the connection between the two Peers.
     *
     * Sets up callbacks that handle any events related to the
     * connection and data received on it.
     */
    function join(hostId) {
        // Close old connection
        if (conn) {
            conn.close();
        }

        // Create connection to destination peer specified in the input field
        conn = peer.connect(hostId, {
            reliable: true
        });

        conn.on('open', function () {
            console.log("Connected to: " + conn.peer);
        });
        // Handle incoming data (messages only since this is the signal sender)
        conn.on('data', function (data) {
            console.log(data);
        });
    }

    /**
     * Send a signal via the peer connection and add it to the log.
     * This will only occur if the connection is still alive.
     */
    function signal(s) {
        if (conn && conn.open) {
            conn.send(s);
            console.log(s + " signal sent");
        } else {
            console.log('Connection is closed');
            joinToHost();
        }
    }

    // Since all our callbacks are setup, start the process of obtaining an ID
    initialize();
    
    function joinToHost() {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const hostId = urlParams.get("hostId");
        if (hostId != null) {
            join(hostId);
        }
    }
})();
