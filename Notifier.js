class Notifier {
  constructor() {
    this.subscribers = [];
    this.strategy = null; // Placeholder for strategy if needed
  }

  subscribe(s) {
    this.subscribers.push(s);
  }

  unsubscribe(s) {
    this.subscribers = this.subscribers.filter(subscriber => subscriber !== s);
  }

  notifySubscribers(message) {
    this.subscribers.forEach(subscriber => subscriber.sendMessage(message));
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  executeStrategy(e) {
    if (this.strategy) {
      const message = this.strategy.execute(e);
      if (!message) {
        Logger.log("No action taken by the strategy.");
        return;
      }
      Logger.log("Strategy executed, returning message: " + message);
      this.notifySubscribers(message);
    } else {
      throw new Error("No strategy set.");
    }
  }

}
