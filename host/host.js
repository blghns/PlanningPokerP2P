(function () {

    let lastPeerId = null;
    let peer = null; // Own peer object
    let connections = {};
    let connectionVoteLookup = {};

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
        });
        peer.on('connection', function (c) {
            console.log("Connected to: " + c.peer);
            ready(c);
            updateLobby();
        });
        peer.on('disconnected', function () {
            console.log('Connection lost. Please reconnect');

            // Workaround for peer.reconnect deleting previous id
            peer.id = lastPeerId;
            peer._lastServerId = lastPeerId;
            peer.reconnect();
        });
        peer.on('close', function () {
            connections = {};
            connectionVoteLookup = {};
            console.log('Connection destroyed');
        });
        peer.on('error', function (err) {
            console.log(err);
            alert('' + err);
        });

        document.querySelector("#getVoteLink").addEventListener("click", () => {
            document.querySelector("#voteLink").value = `${window.location.origin}/PlanningPokerP2P/vote/index.html?hostId=${peer.id}`
        });

        document.querySelector("#revealButton").addEventListener("click", () => {
            updateLobby(true);
        });

        document.querySelector("#clearButton").addEventListener("click", () => {
            Object.keys(connections).forEach(connectionId => {
                connectionVoteLookup[connectionId] = {
                    ...connectionVoteLookup[connectionId],
                    vote: "",
                    type: "present"
                }
            });
            updateLobby();
        });
    }

    /**
     * Defines callbacks to handle incoming data and connection events.
     */
    function ready(conn) {
        connections[conn.connectionId] = conn;
        conn.on('data', function (data) {
            console.log("Data recieved");
            console.log(data);
            connectionVoteLookup[conn.connectionId] = data;
            updateLobby();
        });
        conn.on('close', function () {
            console.log("Connection reset. Awaiting connection...");
            delete connections[conn.connectionId];
            conn = null;
        });
    }

    function updateLobby(reveal) {

        const connectionKeys = Object.keys(connections);
        let total = 0;
        let count = 0;
        let votedCount = 0;
        const tableBody = connectionKeys.map(connectionId => {
            const { username, vote, type } = connectionVoteLookup[connectionId] ?? {};
            const votedText = reveal ? vote : type === "vote" ? "voted" : "present";
            if (Number.isInteger(+vote) && vote !== "") {
                total += +vote;
                count++;
            }
            if (type === "vote") {
                votedCount++;
            }
            return `<tr>
                    <td>${username}</td>
                    <td>${votedText}</td>
                  </tr>`
        });

        let votedText = "";
        if (votedCount === connectionKeys.length) {
            votedText = `<h3>Everyone voted! 🎉</h3>`;
        }

        document.querySelector("#lobby").innerHTML = `<table>
                                                              <tr>
                                                                <th>User</th>
                                                                <th>Vote</th>
                                                              </tr>
                                                              ${tableBody}
                                                            </table>${votedText}`;

        let averageText = "waiting to reveal...";
        if (reveal) {
            const average = total / count;
            averageText = isNaN(average) ? "" : `${average}`;
        }
        document.querySelector("#average").innerHTML = averageText;

    }

    initialize();
})();
