// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract HalalSupplyChain {

    //USER
    enum Role {None, Farmer, Slaughterer, Distributor, Retailer}

    struct UserDetail {
        bool isRegistered;
        Role role;
    }

    mapping(address => UserDetail) public users;
    
    function registerUser(Role _role) public {
        require(!users[msg.sender].isRegistered, "User already registered!");

        users[msg.sender].isRegistered = true;
        users[msg.sender].role = _role;
    }

    //NEW ENUM FOR STATUS
    enum BatchStatus { 
        Created,      // Farmer created
        Slaughtered,  // Slaughterer completed
        Distributed,  // Distributor received
        RetailReady   // Retailer ready
    }

    //ENHANCED FLOW STRUCT
    struct Flow {
        address updatedBy;
        uint256 timestamp;
        string location;
        string content;
        BatchStatus status;
        
        // Fields for slaughter step only
        string supervisorName;
        string halalCertificationBodyName;
        string halalCertificateId;
        uint256 slaughterTimestamp;
    }

    //BATCH STRUCT TO TRACK STATUS
    struct BatchInfo {
        BatchStatus status;
        address currentOwner;
        bool isHalalCertified;
        string halalCertificateId;
        string supervisorName;
        string certifierName;
    }

    mapping(uint256 => Flow[]) public flows;
    mapping(uint256 => BatchInfo) public batchInfo;
    
    uint256 public batchID;
    
    //EVENTS
    event BatchCreated(uint256 indexed batchId, address indexed farmer);
    event BatchUpdated(uint256 indexed batchId, BatchStatus newStatus, address indexed updatedBy);
    event HalalCertified(uint256 indexed batchId, string certificateId, string supervisorName, string certifierName);

    //MODIFIERS
    modifier onlyRegistered() {
        require(users[msg.sender].isRegistered, "User not registered!");
        _;
    }
    
    modifier batchExists(uint256 _batchID) {
        require(flows[_batchID].length > 0, "Batch does not exist!");
        _;
    }

    //CREATE NEW BATCH (FARMER ONLY)
    modifier onlyFarmer() {
        require(users[msg.sender].role == Role.Farmer, "Only farmer allowed");
        _;
    }

    function initialiseBatch(
        string memory _location, 
        string memory _content) external onlyFarmer onlyRegistered {
        
        uint256 currentBatchID = batchID;
        
        // Add initial flow
        flows[currentBatchID].push(
            Flow({
                timestamp: block.timestamp,
                location: _location,
                content: _content,
                updatedBy: msg.sender,
                status: BatchStatus.Created,
                supervisorName: "",
                halalCertificationBodyName: "",
                halalCertificateId: "",
                slaughterTimestamp: 0
            })
        );
        
        // Initialize batch info
        batchInfo[currentBatchID] = BatchInfo({
            status: BatchStatus.Created,
            currentOwner: msg.sender,
            isHalalCertified: false,
            halalCertificateId: "",
            supervisorName: "",
            certifierName: ""
        });
        
        emit BatchCreated(currentBatchID, msg.sender);
        batchID++;    
    }

    //SLAUGHTERER'S FLOW (SLAUGHTERER ONLY)
    modifier onlySlaughterer() {
        require(users[msg.sender].role == Role.Slaughterer, "Only slaughterer allowed");
        _;
    }

    function addSlaughterFlow(
        uint256 _batchID,
        string memory _location,
        string memory _content,
        string memory _supervisorName,
        string memory _halalCertificationBodyName,
        string memory _halalCertificateId,
        uint256 _slaughterTimestamp
    ) external onlySlaughterer onlyRegistered batchExists(_batchID) {
        require(batchInfo[_batchID].status == BatchStatus.Created, "Batch must be in Created state");
        require(bytes(_supervisorName).length > 0, "Supervisor name required");
        require(bytes(_halalCertificationBodyName).length > 0, "Certification body name required");
        require(bytes(_halalCertificateId).length > 0, "Certificate ID required");
        require(_slaughterTimestamp > 0, "Slaughter timestamp required");
        require(_slaughterTimestamp <= block.timestamp, "Slaughter timestamp cannot be in the future");

        // Update batch info
        batchInfo[_batchID].status = BatchStatus.Slaughtered;
        batchInfo[_batchID].currentOwner = msg.sender;
        batchInfo[_batchID].isHalalCertified = true;
        batchInfo[_batchID].halalCertificateId = _halalCertificateId;
        batchInfo[_batchID].supervisorName = _supervisorName;
        batchInfo[_batchID].certifierName = _halalCertificationBodyName;

        // Add slaughter flow
        flows[_batchID].push(
            Flow({
                timestamp: block.timestamp,
                location: _location,
                content: _content,
                updatedBy: msg.sender,
                status: BatchStatus.Slaughtered,
                supervisorName: _supervisorName,
                halalCertificationBodyName: _halalCertificationBodyName,
                halalCertificateId: _halalCertificateId,
                slaughterTimestamp: _slaughterTimestamp
            })
        );

        emit HalalCertified(_batchID, _halalCertificateId, _supervisorName, _halalCertificationBodyName);
        emit BatchUpdated(_batchID, BatchStatus.Slaughtered, msg.sender);
    }

    //DISTRIBUTOR'S FLOW (DISTRIBUTOR ONLY)
    modifier onlyDistributor() {
        require(users[msg.sender].role == Role.Distributor, "Only distributor allowed");
        _;
    }

    function addDistributorFlow(
        uint256 _batchID,
        string memory _location,
        string memory _content
    ) external onlyDistributor onlyRegistered batchExists(_batchID) {
        require(batchInfo[_batchID].status == BatchStatus.Slaughtered, "Batch must be slaughtered first");
        require(batchInfo[_batchID].isHalalCertified, "Batch is not halal certified");

        // Update batch info
        batchInfo[_batchID].status = BatchStatus.Distributed;
        batchInfo[_batchID].currentOwner = msg.sender;

        // Add distributor flow
        flows[_batchID].push(
            Flow({
                timestamp: block.timestamp,
                location: _location,
                content: _content,
                updatedBy: msg.sender,
                status: BatchStatus.Distributed,
                supervisorName: "",
                halalCertificationBodyName: "",
                halalCertificateId: "",
                slaughterTimestamp: 0
            })
        );

        emit BatchUpdated(_batchID, BatchStatus.Distributed, msg.sender);
    }

    //RETAILER'S FLOW (RETAILER ONLY)
    modifier onlyRetailer() {
        require(users[msg.sender].role == Role.Retailer, "Only retailer allowed");
        _;
    }

    function addRetailerFlow(
        uint256 _batchID,
        string memory _location,
        string memory _content
    ) external onlyRetailer onlyRegistered batchExists(_batchID) {
        require(batchInfo[_batchID].status == BatchStatus.Distributed, "Batch must be distributed first");

        // Update batch info
        batchInfo[_batchID].status = BatchStatus.RetailReady;
        batchInfo[_batchID].currentOwner = msg.sender;

        // Add retailer flow
        flows[_batchID].push(
            Flow({
                timestamp: block.timestamp,
                location: _location,
                content: _content,
                updatedBy: msg.sender,
                status: BatchStatus.RetailReady,
                supervisorName: "",
                halalCertificationBodyName: "",
                halalCertificateId: "",
                slaughterTimestamp: 0
            })
        );

        emit BatchUpdated(_batchID, BatchStatus.RetailReady, msg.sender);
    }

    //CONSUMER VIEW FUNCTIONS
    function getAllFlows(uint256 _batchID) external view returns (Flow[] memory) {
        require(flows[_batchID].length > 0, "Batch does not exist!");
        return flows[_batchID];
    }

    function verifyHalalCertification(uint256 _batchID) external view returns (
        bool isHalalCertified,
        string memory certificateId,
        string memory supervisorName,
        string memory certifierName,
        address slaughtererAddress,
        uint256 slaughterTimestamp
    ) {
        require(flows[_batchID].length > 0, "Batch does not exist!");
        
        BatchInfo storage info = batchInfo[_batchID];
        
        // Look for the slaughter flow to get detailed information
        Flow[] storage batchFlows = flows[_batchID];
        for(uint256 i = 0; i < batchFlows.length; i++) {
            if(batchFlows[i].status == BatchStatus.Slaughtered) {
                return (
                    info.isHalalCertified,
                    batchFlows[i].halalCertificateId,
                    batchFlows[i].supervisorName,
                    batchFlows[i].halalCertificationBodyName,
                    batchFlows[i].updatedBy,
                    batchFlows[i].slaughterTimestamp
                );
            }
        }
        
        return (false, "", "", "", address(0), 0);
    }

    function getBatchStatus(uint256 _batchID) external view returns (
        BatchStatus status,
        bool isHalalCertified,
        address currentOwner,
        string memory certificateId,
        string memory supervisorName,
        string memory certifierName
    ) {
        require(flows[_batchID].length > 0, "Batch does not exist!");
        
        BatchInfo storage info = batchInfo[_batchID];
        return (
            info.status,
            info.isHalalCertified,
            info.currentOwner,
            info.halalCertificateId,
            info.supervisorName,
            info.certifierName
        );
    }
    
    // Batch History
    function getBatchHistory(uint256 _batchID) external view returns (
        BatchStatus currentStatus,
        bool isHalalCertified,
        address[] memory participants,
        string[] memory locations,
        uint256[] memory timestamps,
        string[] memory statusNames
    ) {
        require(flows[_batchID].length > 0, "Batch does not exist!");
        
        BatchInfo storage info = batchInfo[_batchID];
        Flow[] storage batchFlows = flows[_batchID];
        
        participants = new address[](batchFlows.length);
        locations = new string[](batchFlows.length);
        timestamps = new uint256[](batchFlows.length);
        statusNames = new string[](batchFlows.length);
        
        for(uint256 i = 0; i < batchFlows.length; i++) {
            participants[i] = batchFlows[i].updatedBy;      // Who
            locations[i] = batchFlows[i].location;          // Where
            timestamps[i] = batchFlows[i].timestamp;        // When
            statusNames[i] = getStatusName(batchFlows[i].status); // status
        }
        
        return (
            info.status,
            info.isHalalCertified,
            participants,
            locations,
            timestamps,
            statusNames
        );
    }
    
    function getStatusName(BatchStatus _status) internal pure returns (string memory) {
        if (_status == BatchStatus.Created) return "Created by Farmer";
        if (_status == BatchStatus.Slaughtered) return "Slaughtered and Halal Certified";
        if (_status == BatchStatus.Distributed) return "Distributed to Retail";
        if (_status == BatchStatus.RetailReady) return "Ready for Sale";
        return "Unknown";
    }
    
    // Get total number of batches
    function getTotalBatches() external view returns (uint256) {
        return batchID;
    }
}