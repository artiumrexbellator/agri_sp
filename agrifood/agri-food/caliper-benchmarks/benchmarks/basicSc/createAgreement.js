/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

const { WorkloadModuleBase } = require("@hyperledger/caliper-core");

function generateRandomId() {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  const idLength = 8;
  let id = "";

  for (let i = 0; i < idLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    id += characters[randomIndex];
  }

  return id;
}

/**
 * Workload module for the benchmark round.
 */
class CreateCommodityWorkload extends WorkloadModuleBase {
  /**
   * Initializes the workload module instance.
   */
  constructor() {
    super();
    this.txIndex = 0;
  }
  /**
   * Assemble TXs for the round.
   * @return {Promise<TxStatus[]>}
   */
  async submitTransaction() {
    this.txIndex++;

    let args = {
      contractId: "basic",
      contractFunction: "CreateAgreement",
      invokerIdentity: "User1",
      contractArguments: ["giqbejtj", generateRandomId()],
    };

    await this.sutAdapter.sendRequests(args);
  }
}

function createWorkloadModule() {
  return new CreateCommodityWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
