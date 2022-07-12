import {
  connectToDaemonRpc,
  createWalletFull,
  MoneroRpcConnection,
  MoneroWalletListener,
} from "monero-javascript";

main();

async function main() {
  const NODE_ADDRESS = "http://127.0.0.1:18081/";
  const USERNAME = "superuser";
  const PASSWORD = "abctesting123";
  const TEST_WALLET_ADDRESS =
    "47KB41kyrnV71oDCYs9FfnBkb1Sxg4CEvUbZVrTnnyq5YEqecaGgkJJDv5PGMnTwSV1ffJYtxgSTC8yoiwuoDHpK6s3Ld1s";
  const TEST_WALLET_KEY =
    "005930630f6aab9bff65ec79c3d41a3df0a4834b6e025c1f2fae709871914404";
  const TEST_WALLET_HEIGHT = 2644000;
  const WALLET_SYNC_PERIOD = 5000;

  const rpcConnection = new MoneroRpcConnection({
    uri: NODE_ADDRESS,
    username: USERNAME,
    password: PASSWORD,
  });

  const daemonRpc = await connectToDaemonRpc({ server: rpcConnection });
  const txHashes = [];

  const txList = [];

  const setBalance = (n) => console.log("balance is:", n);
  const setCurrentSyncProgress = (n) => console.log("progress is:", n);
  const addTransaction = async function (transaction) {
    const currentTxHash = transaction.getHash();
    if (txHashes.includes(currentTxHash)) {
      return;
    }
    txHashes.push(currentTxHash);
    let fullTx;
    if (await wallet.isSynced()) {
      fullTx = await wallet.getTx(currentTxHash);
    } else {
      fullTx = (
        await wallet.getTxs({ hash: currentTxHash, isConfirmed: true })
      )[0];
    }

    const txHeight = fullTx.getHeight();
    const blockHeader = await daemonRpc.current.getBlockHeaderByHeight(
      txHeight
    );
    const timestamp = blockHeader.getTimestamp();

    const displayFormattedTransaction = {
      timeStamp: convertMillisecondsToFormattedDateString(timestamp),
      amount: fullTx.getIncomingAmount().toString(),
      fee: fullTx.getFee().toString(),
      height: fullTx.getHeight().toString(),
      txHash: fullTx.getHash().toString(),
    };

    txList.push(displayFormattedTransaction);
  };

  createWalletFull({
    path: "my_view_only_wallet",
    networkType: "mainnet",
    password: "Random password",
    primaryAddress: TEST_WALLET_ADDRESS,
    privateViewKey: TEST_WALLET_KEY,
    restoreHeight: TEST_WALLET_HEIGHT,
    server: rpcConnection,
  })
    .then(async (wallet) => {
      wallet.addListener(
        new WalletListener(
          setCurrentSyncProgress,
          setBalance,
          addTransaction,
          () => {}
        )
      );
      await wallet.sync(undefined, undefined, true);
      wallet.startSyncing(WALLET_SYNC_PERIOD);
    })
    .catch(console.error);
}

function convertMillisecondsToFormattedDateString(timestamp) {
  return "todo" + timestamp;
}

class WalletListener extends MoneroWalletListener {
  constructor(
    setCurrentSyncProgress,
    setBalance,
    addTransaction,
    checkIfAllInputsAreValid
  ) {
    super();
    this.checkIfAllInputsAreValid = checkIfAllInputsAreValid;
    this.setBalance = setBalance;
    this.addTransaction = addTransaction;
    this.setCurrentSyncProgress = setCurrentSyncProgress;
    this.syncResolution = 0.05;
    this.lastIncrement = 0;
    this.walletIsSynchronized = false;
  }

  onSyncProgress(height, startHeight, endHeight, percentDone, message) {
    this.setCurrentSyncProgress(percentDone * 100);
    if (percentDone >= this.lastIncrement + this.syncResolution) {
      this.lastIncrement += this.syncResolution;
    }
    // Reaching 100% wallet synchronization will change the submit button state
    //if (percentDone === 1) {
    //  this.checkIfAllInputsAreValid();
    //}
  }

  onBalancesChanged(newBalance, newUnlockedBalance) {
    if (this.walletIsSynchronized) {
      this.setBalance(newBalance);
    }
  }

  //When a new TX appears during syncing
  async onOutputReceived(output) {
    this.addTransaction(output.getTx());
  }

  setWalletIsSynchronized(value) {
    this.walletIsSynchronized = value;
  }
}
