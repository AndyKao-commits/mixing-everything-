"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// scripts/vercel-api-entry.ts
var vercel_api_entry_exports = {};
__export(vercel_api_entry_exports, {
  default: () => handler
});
module.exports = __toCommonJS(vercel_api_entry_exports);

// src/data/bingo.ts
var FOOD_PROMPTS = [
  { id: "f1", category: "food", text: "\u62CD\u5230\u751F\u8C6C\u8089", pool: "raw_meat" },
  { id: "f2", category: "food", text: "\u62CD\u5230\u751F\u725B\u8089", pool: "raw_meat" },
  { id: "f3", category: "food", text: "\u62CD\u5230\u751F\u96DE\u8089", pool: "raw_meat" },
  { id: "f4", category: "food", text: "\u62CD\u5230\u751F\u6D77\u9BAE", pool: "raw_meat" },
  { id: "f5", category: "food", text: "\u62CD\u5230\u70E4\u7126\u7684\u8089" },
  { id: "f6", category: "food", text: "\u62CD\u5230\u70E4\u7126\u7684\u83DC" },
  { id: "f7", category: "food", text: "\u62CD\u5230\u6B63\u5728\u6EF4\u6CB9\u7684\u8089" },
  { id: "f8", category: "food", text: "\u62CD\u5230\u6B63\u5728\u5192\u7159\u7684\u98DF\u7269" },
  { id: "f9", category: "food", text: "\u62CD\u5230\u53EA\u5269\u6700\u5F8C\u4E00\u53E3\u7684\u98DF\u7269" },
  { id: "f10", category: "food", text: "\u62CD\u5230\u4E00\u76E4\u5168\u90E8\u90FD\u662F\u8089" },
  { id: "f11", category: "food", text: "\u62CD\u5230\u4E00\u76E4\u5B8C\u5168\u6C92\u6709\u8089" },
  { id: "f12", category: "food", text: "\u62CD\u5230\u4ECA\u5929\u6700\u597D\u770B\u7684\u70E4\u8089" },
  { id: "f13", category: "food", text: "\u62CD\u5230\u4ECA\u5929\u8CE3\u76F8\u6700\u6158\u7684\u98DF\u7269" }
];
var OBJECT_PROMPTS = [
  { id: "o1", category: "object", text: "\u62CD\u5230\u5783\u573E" },
  { id: "o2", category: "object", text: "\u62CD\u5230\u7A7A\u76E4\u5B50" },
  { id: "o3", category: "object", text: "\u62CD\u5230\u88DD\u6EFF\u98DF\u7269\u7684\u76E4\u5B50" },
  { id: "o4", category: "object", text: "\u62CD\u5230\u70E4\u8089\u593E" },
  { id: "o5", category: "object", text: "\u62CD\u5230\u885B\u751F\u7D19" },
  { id: "o6", category: "object", text: "\u62CD\u5230\u4E09\u7A2E\u4E0D\u540C\u98F2\u6599" },
  { id: "o7", category: "object", text: "\u62CD\u5230\u7A7A\u98F2\u6599\u74F6" },
  { id: "o8", category: "object", text: "\u62CD\u5230\u8ABF\u5473\u6599" },
  { id: "o9", category: "object", text: "\u62CD\u5230\u70AD\u706B" },
  { id: "o10", category: "object", text: "\u62CD\u5230\u706B\u7130" },
  { id: "o11", category: "object", text: "\u62CD\u5230\u7D05\u8272\u7269\u54C1" },
  { id: "o12", category: "object", text: "\u62CD\u5230\u5713\u5F62\u7269\u54C1" },
  { id: "o13", category: "object", text: "\u62CD\u5230\u4E09\u500B\u76F8\u540C\u7269\u54C1" },
  { id: "o14", category: "object", text: "\u62CD\u5230\u4E00\u500B\u770B\u8D77\u4F86\u4E0D\u61C9\u8A72\u51FA\u73FE\u5728\u70E4\u8089\u73FE\u5834\u7684\u6771\u897F" }
];
var PEOPLE_PROMPTS = [
  { id: "p1", category: "people", text: "\u8DDF\u5169\u500B\u4EBA\u5408\u7167" },
  { id: "p2", category: "people", text: "\u8DDF\u4E09\u500B\u4EBA\u5408\u7167" },
  { id: "p3", category: "people", text: "\u8DDF\u7A7F\u9ED1\u8272\u8863\u670D\u7684\u4EBA\u5408\u7167" },
  { id: "p4", category: "people", text: "\u8DDF\u7A7F\u767D\u8272\u8863\u670D\u7684\u4EBA\u5408\u7167" },
  { id: "p5", category: "people", text: "\u8DDF\u67D0\u4EBA\u6BD4 YA" },
  { id: "p6", category: "people", text: "\u8DDF\u67D0\u4EBA\u6BD4\u611B\u5FC3" },
  { id: "p7", category: "people", text: "\u8DDF\u6B63\u5728\u5403\u6771\u897F\u7684\u4EBA\u81EA\u62CD" },
  { id: "p8", category: "people", text: "\u8DDF\u6B63\u5728\u70E4\u8089\u7684\u4EBA\u81EA\u62CD" },
  { id: "p9", category: "people", text: "\u8DDF\u67D0\u4EBA\u80CC\u5C0D\u80CC\u62CD\u7167" },
  { id: "p10", category: "people", text: "\u8DDF\u67D0\u4EBA\u505A\u919C\u8868\u60C5" },
  { id: "p11", category: "people", text: "\u4E09\u500B\u4EBA\u62CD\u5BB6\u5EAD\u7167" },
  { id: "p12", category: "people", text: "\u62CD\u4E00\u5F35\u50CF\u5C08\u8F2F\u5C01\u9762\u7684\u7167\u7247" }
];
var MOMENT_PROMPTS = [
  { id: "m1", category: "moment", text: "\u62CD\u5230\u6709\u4EBA\u6B63\u5728\u5403\u6771\u897F" },
  { id: "m2", category: "moment", text: "\u62CD\u5230\u6709\u4EBA\u5634\u5DF4\u585E\u6EFF\u98DF\u7269" },
  { id: "m3", category: "moment", text: "\u62CD\u5230\u6709\u4EBA\u5728\u70E4\u8089" },
  { id: "m4", category: "moment", text: "\u62CD\u5230\u6709\u4EBA\u5728\u6ED1\u624B\u6A5F" },
  { id: "m5", category: "moment", text: "\u62CD\u5230\u6709\u4EBA\u5728\u62CD\u7167" },
  { id: "m6", category: "moment", text: "\u62CD\u5230\u6709\u4EBA\u5728\u81EA\u62CD" },
  { id: "m7", category: "moment", text: "\u62CD\u5230\u6709\u4EBA\u5728\u5012\u98F2\u6599" },
  { id: "m8", category: "moment", text: "\u62CD\u5230\u6709\u4EBA\u62FF\u5169\u500B\u76E4\u5B50" },
  { id: "m9", category: "moment", text: "\u62CD\u5230\u6709\u4EBA\u5927\u7B11" },
  { id: "m10", category: "moment", text: "\u62CD\u5230\u6709\u4EBA\u5728\u6536\u5783\u573E" },
  { id: "m11", category: "moment", text: "\u62CD\u5230\u6709\u4EBA\u6B63\u5728\u5077\u5403" },
  { id: "m12", category: "moment", text: "\u62CD\u5230\u6709\u4EBA\u593E\u6771\u897F\u5931\u6557" }
];
var CREATIVE_PROMPTS = [
  { id: "c1", category: "creative", text: "\u62CD\u4E00\u5F35\u9069\u5408\u505A\u8FF7\u56E0\u7684\u7167\u7247" },
  { id: "c2", category: "creative", text: "\u62CD\u4E00\u5F35\u300C\u9019\u5834\u805A\u6703\u5931\u63A7\u4E86\u300D\u7684\u7167\u7247" },
  { id: "c3", category: "creative", text: "\u62CD\u4E00\u5F35\u300C\u770B\u8D77\u4F86\u5F88\u8CB4\u300D\u7684\u7167\u7247" },
  { id: "c4", category: "creative", text: "\u62CD\u4E00\u5F35\u300C\u770B\u8D77\u4F86\u5F88\u7AAE\u300D\u7684\u7167\u7247" },
  { id: "c5", category: "creative", text: "\u62CD\u4E00\u5F35\u300C\u660E\u660E\u6C92\u4E8B\u4F46\u770B\u8D77\u4F86\u51FA\u5927\u4E8B\u300D\u7684\u7167\u7247" },
  { id: "c6", category: "creative", text: "\u62CD\u4E00\u5F35\u660E\u5929\u5927\u5BB6\u770B\u5230\u9084\u6703\u7B11\u7684\u7167\u7247" }
];
var MYSTERY_PROMPTS = [
  { id: "x1", category: "mystery", text: "\u627E\u4E00\u500B\u4EBA\u8DDF\u4F60\u78B0\u676F\uFF0C\u4F46\u4E0D\u80FD\u5148\u8AAA\u4E7E\u676F" },
  { id: "x2", category: "mystery", text: "\u8B93\u67D0\u4EBA\u4E3B\u52D5\u554F\u300C\u4F60\u5728\u5E79\u561B\u300D" },
  { id: "x3", category: "mystery", text: "\u8B93\u67D0\u4EBA\u4E3B\u52D5\u62FF\u98DF\u7269\u7D66\u4F60" },
  { id: "x4", category: "mystery", text: "\u62CD\u5230\u5169\u500B\u4EBA\u505A\u4E00\u6A23\u7684\u52D5\u4F5C" },
  { id: "x5", category: "mystery", text: "\u62CD\u5230\u6709\u4EBA\u6B63\u5728\u5077\u5403" },
  { id: "x6", category: "mystery", text: "\u62CD\u5230\u8089\uFF0B\u98F2\u6599\uFF0B\u4EBA\uFF0B\u706B\u540C\u6642\u51FA\u73FE" },
  { id: "x7", category: "mystery", text: "\u62CD\u4E00\u5F35\u81F3\u5C11 5 \u4EBA\u7684\u7167\u7247" },
  { id: "x8", category: "mystery", text: "\u627E\u67D0\u4EBA\u5408\u7167\uFF0C\u4F46\u53EA\u6709\u4F60\u53EF\u4EE5\u7B11" },
  { id: "x9", category: "mystery", text: "\u62CD\u4E00\u5F35\u300C\u770B\u8D77\u4F86\u5F88\u8CB4\u300D\u7684\u7167\u7247" },
  { id: "x10", category: "mystery", text: "\u62CD\u4E00\u5F35\u300C\u770B\u8D77\u4F86\u5F88\u7AAE\u300D\u7684\u7167\u7247" },
  { id: "x11", category: "mystery", text: "\u62CD\u4E00\u5F35\u300C\u9019\u5834\u805A\u6703\u5931\u63A7\u4E86\u300D\u7684\u7167\u7247" },
  { id: "x12", category: "mystery", text: "\u62CD\u4E00\u5F35\u9069\u5408\u505A\u8FF7\u56E0\u7684\u7167\u7247" },
  { id: "x13", category: "mystery", text: "\u62CD\u4E00\u5F35\u300C\u660E\u660E\u6C92\u4E8B\u4F46\u770B\u8D77\u4F86\u51FA\u5927\u4E8B\u300D\u7684\u7167\u7247" },
  { id: "x14", category: "mystery", text: "\u62CD\u4E00\u5F35\u660E\u5929\u5927\u5BB6\u770B\u5230\u9084\u6703\u7B11\u7684\u7167\u7247" },
  { id: "x15", category: "mystery", text: "\u8B93\u4E09\u500B\u4EBA\u540C\u6642\u6BD4 YA" },
  { id: "x16", category: "mystery", text: "\u62CD\u5230\u6709\u4EBA\u6B63\u5728\u5E6B\u5225\u4EBA\u70E4\u8089" },
  { id: "x17", category: "mystery", text: "\u62CD\u5230\u6709\u4EBA\u4E00\u6B21\u62FF\u8D85\u904E\u5169\u500B\u6771\u897F" },
  { id: "x18", category: "mystery", text: "\u627E\u5230\u73FE\u5834\u6700\u5C0F\u7684\u98DF\u7269\u4E26\u62CD\u7167" },
  { id: "x19", category: "mystery", text: "\u627E\u5230\u73FE\u5834\u6700\u5927\u7684\u98DF\u7269\u4E26\u62CD\u7167" },
  { id: "x20", category: "mystery", text: "\u62CD\u4E00\u5F35\u300C\u53EA\u6709\u61C2\u7684\u4EBA\u624D\u6703\u7B11\u300D\u7684\u7167\u7247" },
  { id: "x21", category: "mystery", text: "\u8B93\u67D0\u4EBA\u7528\u98DF\u7269\u9935\u4F60\u4E00\u53E3" },
  { id: "x22", category: "mystery", text: "\u62CD\u5230\u6709\u4EBA\u6B63\u5728\u8A8D\u771F\u8A0E\u8AD6\u7121\u95DC\u70E4\u8089\u7684\u4E8B" },
  { id: "x23", category: "mystery", text: "\u62CD\u4E00\u5F35\u770B\u8D77\u4F86\u50CF\u5EE3\u544A\u7684\u73FE\u5834\u7167" },
  { id: "x24", category: "mystery", text: "\u62CD\u5230\u56DB\u7A2E\u4E0D\u540C\u984F\u8272\u540C\u6642\u51FA\u73FE" },
  { id: "x25", category: "mystery", text: "\u62CD\u5230\u6709\u4EBA\u6B63\u5728\u64E6\u624B\u6216\u64E6\u5634" },
  { id: "x26", category: "mystery", text: "\u62CD\u4E00\u5F35\u300C\u4ECA\u665A\u7684\u4E3B\u89D2\u300D\u7167\u7247" },
  { id: "x27", category: "mystery", text: "\u62CD\u5230\u6709\u4EBA\u9589\u773C\u5403\u6771\u897F" },
  { id: "x28", category: "mystery", text: "\u62CD\u5230\u6709\u4EBA\u6B63\u5728\u6307\u8457\u98DF\u7269\u8AAA\u8A71" },
  { id: "x29", category: "mystery", text: "\u62CD\u4E00\u5F35\u300C\u9019\u61C9\u8A72\u4E0A\u71B1\u641C\u300D\u7684\u7167\u7247" },
  { id: "x30", category: "mystery", text: "\u627E\u5169\u500B\u4EBA\u505A\u540C\u6B65\u52D5\u4F5C\u4E26\u62CD\u7167" },
  { id: "x31", category: "mystery", text: "\u62CD\u5230\u6709\u4EBA\u908A\u5403\u908A\u6BD4\u8B9A" },
  { id: "x32", category: "mystery", text: "\u62CD\u4E00\u5F35\u53EA\u6709\u624B\u6C92\u6709\u81C9\u7684\u5408\u7167" },
  { id: "x33", category: "mystery", text: "\u62CD\u5230\u6709\u4EBA\u6B63\u5728\u627E\u4F4D\u5B50\u5750\u4E0B" },
  { id: "x34", category: "mystery", text: "\u62CD\u4E00\u5F35\u300C\u805A\u6703\u5B98\u65B9\u5BA3\u50B3\u5716\u300D" },
  { id: "x35", category: "mystery", text: "\u8B93\u67D0\u4EBA\u5E6B\u4F60\u62CD\u4E00\u5F35\u4F60\u6B63\u5728\u70E4\u8089\u7684\u7167\u7247" },
  { id: "x36", category: "mystery", text: "\u62CD\u5230\u4E09\u7A2E\u91AC\u6599\u540C\u6642\u5165\u93E1" },
  { id: "x37", category: "mystery", text: "\u62CD\u4E00\u5F35\u300C\u4ECA\u665A\u6700\u5B89\u975C\u7684\u4EBA\u300D" },
  { id: "x38", category: "mystery", text: "\u62CD\u4E00\u5F35\u300C\u4ECA\u665A\u6700\u5435\u7684\u77AC\u9593\u300D" },
  { id: "x39", category: "mystery", text: "\u62CD\u5230\u6709\u4EBA\u6B63\u5728\u4E92\u76F8\u593E\u83DC" },
  { id: "x40", category: "mystery", text: "\u62CD\u4E00\u5F35\u300C\u5927\u5BB6\u90FD\u6703\u60F3\u5B58\u4E0B\u4F86\u300D\u7684\u7167\u7247" },
  { id: "x41", category: "mystery", text: "\u8B93\u67D0\u4EBA\u8DDF\u4F60\u78B0\u62F3\u6216\u64CA\u638C\u5F8C\u62CD\u7167" },
  { id: "x42", category: "mystery", text: "\u62CD\u5230\u98F2\u6599\u6EA2\u51FA\u4F86\u6216\u5FEB\u6EFF\u51FA\u4F86" },
  { id: "x43", category: "mystery", text: "\u62CD\u4E00\u5F35\u300C\u770B\u8D77\u4F86\u5F88\u5C08\u696D\u4F46\u5176\u5BE6\u5F88\u96A8\u4FBF\u300D" },
  { id: "x44", category: "mystery", text: "\u62CD\u5230\u6709\u4EBA\u62FF\u7B77\u5B50\uFF0F\u593E\u5B50\u6307\u6771\u6307\u897F" },
  { id: "x45", category: "mystery", text: "\u62CD\u4E00\u5F35\u300C\u9019\u5F35\u53EF\u4EE5\u7576\u684C\u5E03\u300D\u7684\u7167\u7247" },
  { id: "x46", category: "mystery", text: "\u627E\u4EBA\u4E00\u8D77\u505A\u4E00\u500B\u5947\u602A pose" },
  { id: "x47", category: "mystery", text: "\u62CD\u5230\u6709\u4EBA\u6B63\u5728\u5077\u7784\u5225\u4EBA\u624B\u6A5F" },
  { id: "x48", category: "mystery", text: "\u62CD\u4E00\u5F35\u300C\u73FE\u5834\u6700\u6709\u6C23\u6C1B\u300D\u7684\u7167\u7247" },
  { id: "x49", category: "mystery", text: "\u62CD\u5230\u6709\u4EBA\u540C\u6642\u62FF\u98DF\u7269\u8DDF\u98F2\u6599" },
  { id: "x50", category: "mystery", text: "\u62CD\u4E00\u5F35\u300C\u5982\u679C\u9019\u662F\u96FB\u5F71\u6D77\u5831\u300D\u7684\u7167\u7247" }
];

// src/data/tasks.ts
var SECRET_TASK_TEMPLATES = [
  { text: "\u5728\u6307\u5B9A\u73A9\u5BB6\u8EAB\u4E0A\u8CBC\u4E00\u5F35\u8CBC\u7D19", points: 1, needsTarget: true },
  { text: "\u70E4\u4E00\u4EFD\u8089\u7D66\u6307\u5B9A\u73A9\u5BB6\u5403", points: 2, needsTarget: true },
  { text: "\u70E4\u4E00\u4EFD\u83DC\u7D66\u6307\u5B9A\u73A9\u5BB6", points: 1, needsTarget: true },
  { text: "\u5E6B\u6307\u5B9A\u73A9\u5BB6\u5012\u98F2\u6599", points: 1, needsTarget: true },
  { text: "\u8DDF\u6307\u5B9A\u73A9\u5BB6\u78B0\u676F", points: 1, needsTarget: true },
  { text: "\u8DDF\u6307\u5B9A\u73A9\u5BB6\u64CA\u638C", points: 1, needsTarget: true },
  { text: "\u8DDF\u6307\u5B9A\u73A9\u5BB6\u81EA\u62CD", points: 1, needsTarget: true },
  { text: "\u5750\u5230\u6307\u5B9A\u73A9\u5BB6\u65C1\u908A", points: 1, needsTarget: true },
  { text: "\u5E6B\u6307\u5B9A\u73A9\u5BB6\u62FF\u76E4\u5B50", points: 1, needsTarget: true },
  { text: "\u8B93\u6307\u5B9A\u73A9\u5BB6\u5E6B\u4F60\u62CD\u7167", points: 2, needsTarget: true },
  { text: "\u8B93\u6307\u5B9A\u73A9\u5BB6\u53EB\u51FA\u4F60\u7684\u540D\u5B57", points: 1, needsTarget: true },
  { text: "\u8B93\u6307\u5B9A\u73A9\u5BB6\u7B11", points: 1, needsTarget: true },
  { text: "\u8B93\u6307\u5B9A\u73A9\u5BB6\u4E3B\u52D5\u62FF\u98DF\u7269\u7D66\u4F60", points: 2, needsTarget: true },
  { text: "\u8DDF\u6307\u5B9A\u73A9\u5BB6\u4E00\u8D77\u6BD4 YA \u62CD\u7167", points: 1, needsTarget: true }
];
var TARGET_TASKS = [
  { text: "\u8B93\u76EE\u6A19\u4E3B\u52D5\u8DDF\u4F60\u62CD\u7167", points: 2 },
  { text: "\u8B93\u76EE\u6A19\u4E3B\u52D5\u8DDF\u4F60\u78B0\u676F", points: 2 },
  { text: "\u8B93\u76EE\u6A19\u4E3B\u52D5\u62FF\u98DF\u7269\u7D66\u4F60", points: 2 },
  { text: "\u8B93\u76EE\u6A19\u4E3B\u52D5\u53EB\u4F60\u540D\u5B57", points: 1 },
  { text: "\u8B93\u76EE\u6A19\u4E3B\u52D5\u8DDF\u4F60\u81EA\u62CD", points: 2 }
];
var BOUNTY_TEMPLATES = [
  { text: "\u7528\u6C23\u7403\u6298\u4E00\u96BB\u72D7", points: 2 },
  { text: "\u7528\u7D19\u756B\u81EA\u5DF1\u7684\u81EA\u756B\u50CF", points: 1 },
  { text: "\u7528\u7B77\u5B50\u6392\u51FA\u81EA\u5DF1\u7684\u540D\u5B57", points: 1 },
  { text: "\u7528\u885B\u751F\u7D19\u505A\u4E00\u500B\u6771\u897F", points: 1 },
  { text: "\u7528\u98DF\u7269\u6392\u51FA\u611B\u5FC3", points: 1 },
  { text: "\u7528\u73FE\u5834\u7269\u54C1\u84CB\u4E00\u9593\u5C0F\u623F\u5B50", points: 2 },
  { text: "\u7528\u73FE\u5834\u7269\u54C1\u758A\u4E00\u5EA7\u5854", points: 1 },
  { text: "\u627E\u4E09\u7A2E\u4E0D\u540C\u984F\u8272\u7684\u98F2\u6599\u62CD\u7167", points: 1 },
  { text: "\u5728\u7D19\u4E0A\u63CF\u51FA\u81EA\u5DF1\u7684\u624B", points: 1 },
  { text: "\u505A\u4E00\u76E4\u9AD8\u7D1A\u9910\u5EF3\u98A8\u683C\u7684\u70E4\u8089\u64FA\u76E4", points: 2 },
  { text: "\u70E4\u51FA\u81EA\u5DF1\u8A8D\u70BA\u6700\u597D\u770B\u7684\u8089", points: 1 },
  { text: "\u7528\u98DF\u7269\u6392\u51FA\u4E00\u5F35\u81C9", points: 2 },
  { text: "\u756B\u73FE\u5834\u5176\u4E2D\u4E00\u500B\u4EBA\uFF0C\u8B93\u5176\u4ED6\u4EBA\u731C", points: 2 },
  { text: "\u7528\u73FE\u5834\u7269\u54C1\u6392\u51FA\u4E00\u500B\u4E2D\u6587\u5B57", points: 1 },
  { text: "\u505A\u4E00\u4E32\u5305\u542B\u4E09\u7A2E\u4E0D\u540C\u98DF\u6750\u7684\u70E4\u4E32", points: 1 },
  { text: "\u7528\u74F6\u5B50\u6392\u51FA\u4E00\u500B\u611B\u5FC3", points: 1 },
  { text: "\u62CD\u4E00\u5F35\u300C\u770B\u8D77\u4F86\u50CF\u5EE3\u544A\u300D\u7684\u64FA\u76E4", points: 1 },
  { text: "\u7528\u8449\u5B50\u6216\u7D19\u505A\u4E00\u9802\u5E3D\u5B50\u7D66\u81EA\u5DF1\u6234", points: 2 },
  { text: "\u628A\u4E09\u76E4\u98DF\u7269\u6392\u6210\u4E00\u689D\u76F4\u7DDA\u62CD\u7167", points: 1 },
  { text: "\u7528\u73FE\u5834\u7269\u54C1\u505A\u51FA\u4E00\u500B\u7BAD\u982D\u6307\u5411\u67D0\u4EBA", points: 1 }
];
var DONT_COPY_PROMPTS = [
  "\u8AAA\u51FA\u4E00\u7A2E\u70E4\u8089\u6703\u51FA\u73FE\u7684\u98DF\u7269",
  "\u8AAA\u51FA\u4E00\u7A2E\u98F2\u6599",
  "\u8AAA\u51FA\u4E00\u7A2E\u52D5\u7269",
  "\u8AAA\u51FA\u4E00\u500B\u53F0\u7063\u57CE\u5E02",
  "\u8AAA\u51FA\u4E00\u500B\u59D3\u6C0F",
  "\u8AAA\u51FA\u4E00\u7A2E\u4FBF\u5229\u5546\u5E97\u5546\u54C1",
  "\u8AAA\u51FA\u4E00\u500B\u7D04\u6703\u5730\u9EDE",
  "\u8AAA\u51FA\u4E00\u500B\u5206\u624B\u7406\u7531",
  "\u8AAA\u51FA\u4E00\u500B\u4E0D\u80FD\u63A5\u53D7\u7684\u53E6\u4E00\u534A\u7FD2\u6163",
  "\u8AAA\u51FA\u4E00\u7A2E\u6703\u8B93\u4EBA\u7B11\u7684\u8072\u97F3"
];
var WHO_WROTE_PROMPTS = [
  "\u8B1B\u4E00\u4EF6\u5927\u5BB6\u53EF\u80FD\u4E0D\u77E5\u9053\u95DC\u65BC\u4F60\u7684\u4E8B\u60C5\u3002",
  "\u4ECA\u665A\u4F60\u6700\u4E0D\u60F3\u88AB\u62CD\u5230\u7684\u756B\u9762\u662F\u4EC0\u9EBC\uFF1F",
  "\u5982\u679C\u8981\u7528\u4E00\u7A2E\u98DF\u7269\u5F62\u5BB9\u81EA\u5DF1\uFF0C\u6703\u662F\u4EC0\u9EBC\uFF1F",
  "\u8AAA\u4E00\u4EF6\u4F60\u6700\u8FD1\u5F88\u5728\u610F\u3001\u4F46\u5F88\u5C11\u8DDF\u4EBA\u63D0\u7684\u4E8B\u3002",
  "\u4ECA\u665A\u4F60\u6700\u611F\u8B1D\u5728\u5834\u7684\u54EA\u7A2E\u77AC\u9593\uFF1F",
  "\u7528\u4E00\u53E5\u8A71\u5F62\u5BB9\u4ECA\u5929\u7684\u805A\u6703\u3002",
  "\u8AAA\u4E00\u500B\u4F60\u89BA\u5F97\u5F88\u4E1F\u81C9\u4F46\u5176\u5BE6\u9084\u597D\u7684\u7FD2\u6163\u3002",
  "\u5982\u679C\u660E\u5929\u53EA\u80FD\u518D\u898B\u5230\u5176\u4E2D\u4E00\u4EBA\uFF0C\u4F60\u6703\u60F3\u898B\u5230\u8AB0\uFF1F\u70BA\u4EC0\u9EBC\uFF1F\uFF08\u53EF\u4E0D\u9EDE\u540D\uFF09"
];

// src/lib/crypto.ts
var import_crypto = require("crypto");
function uid() {
  return (0, import_crypto.randomBytes)(16).toString("hex");
}
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function hashPin(pin, salt) {
  const useSalt = salt || (0, import_crypto.randomBytes)(16).toString("hex");
  const hash = (0, import_crypto.scryptSync)(pin, useSalt, 32).toString("hex");
  return { hash, salt: useSalt };
}
function verifyPin(pin, hash, salt) {
  try {
    const next = (0, import_crypto.scryptSync)(pin, salt, 32);
    const prev = Buffer.from(hash, "hex");
    if (next.length !== prev.length) return false;
    return (0, import_crypto.timingSafeEqual)(next, prev);
  } catch {
    return false;
  }
}
function authSecret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PIN || "bbq-party-demo-secret";
}
function sign(payload) {
  return (0, import_crypto.createHmac)("sha256", authSecret()).update(payload).digest("hex");
}
function safeEqualHex(a, b) {
  try {
    const left = Buffer.from(a, "hex");
    const right = Buffer.from(b, "hex");
    if (left.length !== right.length) return false;
    return (0, import_crypto.timingSafeEqual)(left, right);
  } catch {
    return false;
  }
}
function signAdminToken(ttlMs = 1e3 * 60 * 60 * 12) {
  const exp = Date.now() + ttlMs;
  const nonce = (0, import_crypto.randomBytes)(8).toString("hex");
  const payload = `a:${exp}:${nonce}`;
  return `${payload}:${sign(payload)}`;
}
function verifyAdminToken(token) {
  if (!token) return false;
  const parts = token.split(":");
  if (parts.length !== 4 || parts[0] !== "a") return false;
  const [, expRaw, nonce, sig] = parts;
  if (!/^\d+$/.test(expRaw) || !nonce || !sig) return false;
  if (Number(expRaw) < Date.now()) return false;
  const payload = `a:${expRaw}:${nonce}`;
  return safeEqualHex(sig, sign(payload));
}
function signPlayerToken(playerId, ttlMs = 1e3 * 60 * 60 * 24 * 7) {
  const exp = Date.now() + ttlMs;
  const payload = `p:${playerId}:${exp}`;
  return `${payload}:${sign(payload)}`;
}
function verifyPlayerToken(token) {
  if (!token) return null;
  const parts = token.split(":");
  if (parts.length !== 4 || parts[0] !== "p") return null;
  const [, playerId, expRaw, sig] = parts;
  if (!playerId || !/^\d+$/.test(expRaw) || !sig) return null;
  const expiresAt = Number(expRaw);
  if (expiresAt < Date.now()) return null;
  const payload = `p:${playerId}:${expRaw}`;
  if (!safeEqualHex(sig, sign(payload))) return null;
  return { playerId, expiresAt };
}

// src/lib/persist.ts
var STATE_KEY = "bbq-party-state-v1";
var PHOTO_PREFIX = "bbq-party-photo:";
var TTL_SECONDS = 60 * 60 * 24 * 14;
var memory = /* @__PURE__ */ new Map();
async function getRuntimeCache() {
  if (!process.env.VERCEL) return null;
  try {
    const req = typeof require === "function" ? require : null;
    if (!req) return null;
    const mod = req("@vercel/functions");
    if (typeof mod?.getCache !== "function") return null;
    return mod.getCache({ namespace: "bbq-party" });
  } catch {
    return null;
  }
}
function readLocalFile(key) {
  if (process.env.VERCEL || key !== STATE_KEY) return null;
  try {
    const fs = require("fs");
    const path = require("path");
    const file = path.join(process.cwd(), ".data", "bbq-store.json");
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}
function writeLocalFile(key, value) {
  if (process.env.VERCEL || key !== STATE_KEY) return;
  try {
    const fs = require("fs");
    const path = require("path");
    const file = path.join(process.cwd(), ".data", "bbq-store.json");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(value));
  } catch (error) {
    console.error("writeLocalFile failed", error);
  }
}
async function persistGet(key) {
  try {
    const cache = await getRuntimeCache();
    if (cache) {
      const value = await cache.get(key);
      if (value != null) return value;
    }
  } catch (error) {
    console.error("persistGet cache error", key, error);
  }
  if (memory.has(key)) return memory.get(key);
  const fromFile = readLocalFile(key);
  if (fromFile != null) return fromFile;
  return null;
}
async function persistSet(key, value) {
  memory.set(key, value);
  writeLocalFile(key, value);
  try {
    const cache = await getRuntimeCache();
    if (cache) {
      await cache.set(key, value, { ttl: TTL_SECONDS, tags: ["bbq-party"] });
    }
  } catch (error) {
    console.error("persistSet cache error", key, error);
  }
}
async function persistGetState() {
  return persistGet(STATE_KEY);
}
async function persistSetState(value) {
  await persistSet(STATE_KEY, value);
}
async function persistGetPhoto(cellId) {
  const value = await persistGet(PHOTO_PREFIX + cellId);
  return typeof value === "string" ? value : null;
}
async function persistSetPhoto(cellId, dataUrl) {
  await persistSet(PHOTO_PREFIX + cellId, dataUrl);
}

// src/lib/scoring.ts
var LINES = [
  ["r0", [0, 1, 2]],
  ["r1", [3, 4, 5]],
  ["r2", [6, 7, 8]],
  ["c0", [0, 3, 6]],
  ["c1", [1, 4, 7]],
  ["c2", [2, 5, 8]],
  ["d0", [0, 4, 8]],
  ["d1", [2, 4, 6]]
];
function totalScore(txs, playerId) {
  return txs.filter((t) => t.player_id === playerId).reduce((sum, t) => sum + t.points, 0);
}
function computeBingoBonuses(card) {
  const done = new Set(card.cells.filter((c) => c.completed).map((c) => c.index));
  const newLines = [];
  for (const [key, idxs] of LINES) {
    if (card.line_bonuses.includes(key)) continue;
    if (idxs.every((i) => done.has(i))) newLines.push(key);
  }
  const fullBonus = !card.full_bonus && done.size === 9;
  return { newLines, fullBonus };
}

// src/lib/target-cycle.ts
function buildTargetCycle(playerIds) {
  if (playerIds.length < 2) return [];
  const shuffled = [...playerIds];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const pairs = [];
  for (let i = 0; i < shuffled.length; i += 1) {
    const from = shuffled[i];
    const to = shuffled[(i + 1) % shuffled.length];
    pairs.push([from, to]);
  }
  return pairs;
}

// src/lib/game-store.ts
var g = globalThis;
function store() {
  if (!g.__bbqStore) {
    g.__bbqStore = {
      event: null,
      players: /* @__PURE__ */ new Map(),
      sessions: /* @__PURE__ */ new Map(),
      scores: [],
      bingoCards: /* @__PURE__ */ new Map(),
      secretTasks: /* @__PURE__ */ new Map(),
      bounties: [],
      playerBounties: /* @__PURE__ */ new Map(),
      targets: /* @__PURE__ */ new Map(),
      groupGames: /* @__PURE__ */ new Map(),
      messages: /* @__PURE__ */ new Map(),
      prizeDecisions: /* @__PURE__ */ new Map(),
      settlement: null,
      finalClicks: /* @__PURE__ */ new Map(),
      mysteryUsed: /* @__PURE__ */ new Set(),
      adminSessions: /* @__PURE__ */ new Set()
    };
  }
  return g.__bbqStore;
}
function requireEvent() {
  const event = store().event;
  if (!event) throw new Error("\u5C1A\u672A\u5EFA\u7ACB\u6D3B\u52D5");
  return event;
}
function touch(event) {
  event.updated_at = nowIso();
}
function assertNotLocked(event) {
  if (event.score_locked || event.status === "score_locked" || event.status === "settlement" || event.status === "finished") {
    throw new Error("\u7A4D\u5206\u5DF2\u9396\u5B9A\uFF0C\u7121\u6CD5\u518D\u8A08\u5206");
  }
}
function addScore(event, playerId, source_type, source_id, points, note) {
  assertNotLocked(event);
  if (points === 0) return;
  const exists = store().scores.some(
    (s) => s.event_id === event.id && s.player_id === playerId && s.source_type === source_type && s.source_id === source_id
  );
  if (exists) throw new Error("\u6B64\u9805\u76EE\u5DF2\u8A08\u904E\u5206");
  store().scores.push({
    id: uid(),
    event_id: event.id,
    player_id: playerId,
    source_type,
    source_id,
    points,
    note,
    created_at: nowIso()
  });
}
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function takeUnique(prompts, used, n) {
  const pool = shuffle(prompts.filter((p) => !used.has(p.id)));
  const out = [];
  const poolsTaken = /* @__PURE__ */ new Set();
  for (const p of pool) {
    if (out.length >= n) break;
    if (p.pool && poolsTaken.has(p.pool)) continue;
    out.push(p);
    used.add(p.id);
    if (p.pool) poolsTaken.add(p.pool);
  }
  while (out.length < n && prompts.length) {
    out.push(pick(prompts));
  }
  return out;
}
function buildBingoCard(eventId, playerId, playerNames) {
  const used = /* @__PURE__ */ new Set();
  const food = takeUnique(FOOD_PROMPTS, used, 2);
  const object = takeUnique(OBJECT_PROMPTS, used, 2);
  const people = takeUnique(PEOPLE_PROMPTS, used, 2);
  const moment = takeUnique(MOMENT_PROMPTS, used, 1);
  const creative = takeUnique(CREATIVE_PROMPTS, used, 1);
  const others = playerNames.filter((n) => n);
  const namedText = others.length ? `\u8DDF ${pick(others)} \u5408\u7167` : "\u8DDF\u6307\u5B9A\u73A9\u5BB6\u5408\u7167";
  const named = {
    id: `named_${uid()}`,
    category: "named",
    text: namedText
  };
  const mysteryPool = MYSTERY_PROMPTS.filter((p) => !store().mysteryUsed.has(p.id));
  const mysterySource = mysteryPool.length ? mysteryPool : MYSTERY_PROMPTS;
  const mystery = takeUnique(mysterySource, store().mysteryUsed, 2);
  mystery.forEach((m) => store().mysteryUsed.add(m.id));
  const selected = shuffle([
    ...food,
    ...object,
    ...people,
    ...moment,
    ...creative,
    named,
    ...mystery
  ]).slice(0, 9);
  while (selected.length < 9) {
    selected.push(pick(OBJECT_PROMPTS));
  }
  const cells = selected.map((p, index) => ({
    id: uid(),
    index,
    category: p.category,
    text: p.text,
    mystery: p.category === "mystery",
    revealed: p.category !== "mystery",
    photo_data_url: null,
    completed: false,
    completed_at: null
  }));
  return {
    id: uid(),
    event_id: eventId,
    player_id: playerId,
    cells,
    line_bonuses: [],
    full_bonus: false
  };
}
function ensurePlayerAssignments(event) {
  const players = [...store().players.values()].filter((p) => p.event_id === event.id);
  if (players.length < 2) return;
  for (const player of players) {
    if (![...store().bingoCards.values()].some((c) => c.player_id === player.id)) {
      const names = players.filter((p) => p.id !== player.id).map((p) => p.name);
      store().bingoCards.set(player.id, buildBingoCard(event.id, player.id, names));
    }
    if (![...store().secretTasks.values()].some((t) => t.player_id === player.id)) {
      const tpl = pick(SECRET_TASK_TEMPLATES);
      const others = players.filter((p) => p.id !== player.id);
      const target = tpl.needsTarget && others.length ? pick(others) : null;
      const text = target ? tpl.text.replace("\u6307\u5B9A\u73A9\u5BB6", target.name) : tpl.text;
      const task = {
        id: uid(),
        event_id: event.id,
        player_id: player.id,
        text,
        points: tpl.points,
        target_player_id: target?.id ?? null,
        completed: false,
        completed_at: null
      };
      store().secretTasks.set(task.id, task);
    }
  }
  if (store().targets.size === 0 && players.length >= 2) {
    const pairs = buildTargetCycle(players.map((p) => p.id));
    for (const [from, to] of pairs) {
      const tpl = pick(TARGET_TASKS);
      const targetPlayer = store().players.get(to);
      const row = {
        id: uid(),
        event_id: event.id,
        player_id: from,
        target_player_id: to,
        text: tpl.text.replace("\u76EE\u6A19", targetPlayer.name),
        points: tpl.points,
        completed: false,
        completed_at: null
      };
      store().targets.set(from, row);
    }
  }
  if (store().bounties.length === 0) {
    store().bounties = shuffle(BOUNTY_TEMPLATES).slice(0, 20).map((b) => ({
      id: uid(),
      event_id: event.id,
      text: b.text,
      points: b.points
    }));
  }
}
function publicPlayers() {
  return [...store().players.values()].sort((a, b) => a.created_at.localeCompare(b.created_at)).map((p) => ({
    id: p.id,
    name: p.name,
    pin_set: p.pin_set,
    last_seen_at: p.last_seen_at
  }));
}
function playerScore(playerId) {
  return totalScore(store().scores, playerId);
}
function rankings() {
  const event = requireEvent();
  return [...store().players.values()].filter((p) => p.event_id === event.id).map((p) => ({
    player_id: p.id,
    name: p.name,
    score: playerScore(p.id)
  })).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).map((row, i) => ({ ...row, rank: i + 1 }));
}
function getSession(token) {
  if (!token) return null;
  const existing = [...store().sessions.values()].find((s) => s.token === token);
  if (existing) {
    if (new Date(existing.expires_at).getTime() < Date.now()) {
      store().sessions.delete(existing.id);
      return null;
    }
    return existing;
  }
  const verified = verifyPlayerToken(token);
  if (!verified) return null;
  const event = store().event;
  if (!event) return null;
  const session = {
    id: uid(),
    event_id: event.id,
    player_id: verified.playerId,
    token,
    created_at: nowIso(),
    expires_at: new Date(verified.expiresAt).toISOString()
  };
  store().sessions.set(session.id, session);
  return session;
}
function requirePlayerSession(token) {
  const session = getSession(token);
  if (!session) throw new Error("\u8ACB\u91CD\u65B0\u767B\u5165");
  const player = store().players.get(session.player_id);
  if (!player) throw new Error("\u73A9\u5BB6\u4E0D\u5B58\u5728");
  player.last_seen_at = nowIso();
  return { session, player };
}
function requireAdmin(token) {
  if (!token) throw new Error("\u7BA1\u7406\u54E1\u672A\u767B\u5165");
  if (verifyAdminToken(token) || store().adminSessions.has(token)) return true;
  throw new Error("\u7BA1\u7406\u54E1\u672A\u767B\u5165");
}
function serializeStore() {
  const photoIds = [];
  const bingoCards = [...store().bingoCards.values()].map((card) => ({
    ...card,
    cells: card.cells.map((cell) => {
      if (cell.photo_data_url) {
        photoIds.push(cell.id);
        return { ...cell, photo_data_url: null, photo_ref: cell.id };
      }
      return { ...cell, photo_data_url: null };
    })
  }));
  return {
    event: store().event,
    players: [...store().players.values()],
    sessions: [...store().sessions.values()],
    scores: store().scores,
    bingoCards,
    secretTasks: [...store().secretTasks.values()],
    bounties: store().bounties,
    playerBounties: [...store().playerBounties.values()],
    targets: [...store().targets.entries()],
    groupGames: [...store().groupGames.values()],
    messages: [...store().messages.values()],
    prizeDecisions: [...store().prizeDecisions.values()],
    settlement: store().settlement,
    finalClicks: [...store().finalClicks.entries()],
    mysteryUsed: [...store().mysteryUsed],
    adminSessions: [...store().adminSessions],
    photoIds
  };
}
function hydrateStore(data) {
  const next = store();
  next.event = data.event;
  next.players = new Map((data.players || []).map((p) => [p.id, p]));
  next.sessions = new Map((data.sessions || []).map((s) => [s.id, s]));
  next.scores = data.scores || [];
  next.bingoCards = new Map(
    (data.bingoCards || []).map((card) => [
      card.player_id,
      {
        ...card,
        cells: card.cells.map((cell) => ({
          ...cell,
          photo_data_url: cell.photo_data_url
        }))
      }
    ])
  );
  next.secretTasks = new Map((data.secretTasks || []).map((t) => [t.id, t]));
  next.bounties = data.bounties || [];
  next.playerBounties = new Map((data.playerBounties || []).map((pb) => [pb.id, pb]));
  next.targets = new Map(data.targets || []);
  next.groupGames = new Map((data.groupGames || []).map((g2) => [g2.id, g2]));
  next.messages = new Map((data.messages || []).map((m) => [m.id, m]));
  next.prizeDecisions = new Map((data.prizeDecisions || []).map((d) => [d.player_id, d]));
  next.settlement = data.settlement;
  next.finalClicks = new Map(data.finalClicks || []);
  next.mysteryUsed = new Set(data.mysteryUsed || []);
  next.adminSessions = new Set(data.adminSessions || []);
}
function activeGroupGame() {
  const event = store().event;
  if (!event?.group_game_id) return null;
  return store().groupGames.get(event.group_game_id) || null;
}
var gameStore = {
  bootstrap() {
    if (store().event) return;
    const adminPin = process.env.ADMIN_PIN || "2468";
    const { hash, salt } = hashPin(adminPin);
    const now = nowIso();
    const event = {
      id: uid(),
      name: "\u4ECA\u665A\u70E4\u8089\u6D3E\u5C0D",
      status: "setup",
      admin_pin_hash: hash,
      admin_pin_salt: salt,
      active_group_game: "none",
      group_game_id: null,
      score_locked: false,
      settlement_started_at: null,
      donation_ends_at: null,
      created_at: now,
      updated_at: now,
      last_group_game_at: null
    };
    store().event = event;
    const names = [
      "\u963F\u6A02",
      "\u5C0F\u5091",
      "Kevin",
      "Mia",
      "\u5A77\u5A77",
      "\u963F\u660E",
      "\u5C0F\u96E8",
      "Jamie",
      "\u963F\u8C6A",
      "Yuki",
      "\u5C0F\u5B89",
      "Chris",
      "\u963F\u73CD",
      "Ben",
      "\u5C0F\u9B5A"
    ];
    names.forEach((name) => {
      const p = {
        id: uid(),
        event_id: event.id,
        name,
        pin_hash: null,
        pin_salt: null,
        pin_set: false,
        created_at: nowIso(),
        last_seen_at: null
      };
      store().players.set(p.id, p);
    });
  },
  getPublicState() {
    this.bootstrap();
    const event = requireEvent();
    return {
      event: {
        id: event.id,
        name: event.name,
        status: event.status,
        active_group_game: event.active_group_game,
        score_locked: event.score_locked,
        donation_ends_at: event.donation_ends_at,
        settlement_started_at: event.settlement_started_at,
        last_group_game_at: event.last_group_game_at
      },
      players: publicPlayers(),
      groupGame: activeGroupGame(),
      settlement: store().settlement
    };
  },
  async load() {
    const data = await persistGetState();
    if (!data?.event) return;
    hydrateStore(data);
    for (const card of store().bingoCards.values()) {
      for (const cell of card.cells) {
        if (cell.photo_data_url) continue;
        const photo = await persistGetPhoto(cell.id);
        if (photo) cell.photo_data_url = photo;
      }
    }
  },
  async save() {
    const snapshot = serializeStore();
    for (const card of store().bingoCards.values()) {
      for (const cell of card.cells) {
        if (cell.photo_data_url) {
          await persistSetPhoto(cell.id, cell.photo_data_url);
        }
      }
    }
    await persistSetState(snapshot);
  },
  adminLogin(pin) {
    this.bootstrap();
    const event = requireEvent();
    if (!verifyPin(pin, event.admin_pin_hash, event.admin_pin_salt)) {
      throw new Error("\u7BA1\u7406\u54E1\u5BC6\u78BC\u932F\u8AA4");
    }
    const token = signAdminToken();
    store().adminSessions.add(token);
    return { token, ...this.getAdminState() };
  },
  getAdminState() {
    const event = requireEvent();
    const { admin_pin_hash: _h, admin_pin_salt: _s, ...safeEvent } = event;
    return {
      event: safeEvent,
      players: [...store().players.values()].map((p) => ({
        ...p,
        pin_hash: null,
        pin_salt: null
      })),
      rankings: rankings(),
      scores: store().scores,
      groupGame: activeGroupGame(),
      settlement: store().settlement,
      prizeDecisions: [...store().prizeDecisions.values()],
      messages: [...store().messages.values()]
    };
  },
  requireAdmin,
  createPlayer(adminToken, name) {
    requireAdmin(adminToken);
    const event = requireEvent();
    const player = {
      id: uid(),
      event_id: event.id,
      name: name.trim().slice(0, 16),
      pin_hash: null,
      pin_salt: null,
      pin_set: false,
      created_at: nowIso(),
      last_seen_at: null
    };
    store().players.set(player.id, player);
    if (event.status === "setup") {
      store().targets.clear();
    }
    touch(event);
    return player;
  },
  renamePlayer(adminToken, playerId, name) {
    requireAdmin(adminToken);
    const player = store().players.get(playerId);
    if (!player) throw new Error("\u73A9\u5BB6\u4E0D\u5B58\u5728");
    player.name = name.trim().slice(0, 16);
    return player;
  },
  deletePlayer(adminToken, playerId) {
    requireAdmin(adminToken);
    const event = requireEvent();
    if (event.status !== "setup") throw new Error("\u6D3B\u52D5\u958B\u59CB\u5F8C\u4E0D\u53EF\u522A\u9664\u73A9\u5BB6");
    store().players.delete(playerId);
    store().bingoCards.delete(playerId);
    store().targets.delete(playerId);
    for (const [id, t] of store().secretTasks) {
      if (t.player_id === playerId) store().secretTasks.delete(id);
    }
    return true;
  },
  adjustScore(adminToken, playerId, points, note) {
    requireAdmin(adminToken);
    const event = requireEvent();
    addScore(event, playerId, "admin_adjustment", uid(), points, note || "\u624B\u52D5\u8ABF\u6574");
    return { score: playerScore(playerId) };
  },
  activateEvent(adminToken) {
    requireAdmin(adminToken);
    const event = requireEvent();
    if ([...store().players.values()].length < 2) throw new Error("\u81F3\u5C11\u9700\u8981 2 \u4F4D\u73A9\u5BB6");
    ensurePlayerAssignments(event);
    event.status = "active";
    touch(event);
    return this.getAdminState();
  },
  setPlayerPin(playerId, pin, confirm) {
    this.bootstrap();
    if (!/^\d{4}$/.test(pin)) throw new Error("PIN \u9700\u70BA 4 \u4F4D\u6578\u5B57");
    if (pin !== confirm) throw new Error("\u5169\u6B21 PIN \u4E0D\u4E00\u81F4");
    const player = store().players.get(playerId);
    if (!player) throw new Error("\u73A9\u5BB6\u4E0D\u5B58\u5728");
    if (player.pin_set) throw new Error("\u6B64\u73A9\u5BB6\u5DF2\u8A2D\u5B9A PIN\uFF0C\u8ACB\u76F4\u63A5\u767B\u5165");
    const { hash, salt } = hashPin(pin);
    player.pin_hash = hash;
    player.pin_salt = salt;
    player.pin_set = true;
    return this.loginPlayer(playerId, pin);
  },
  loginPlayer(playerId, pin) {
    this.bootstrap();
    const event = requireEvent();
    const player = store().players.get(playerId);
    if (!player || !player.pin_hash || !player.pin_salt) throw new Error("\u8ACB\u5148\u8A2D\u5B9A PIN");
    if (!verifyPin(pin, player.pin_hash, player.pin_salt)) throw new Error("PIN \u932F\u8AA4");
    const token = signPlayerToken(player.id);
    const verified = verifyPlayerToken(token);
    const session = {
      id: uid(),
      event_id: event.id,
      player_id: player.id,
      token,
      created_at: nowIso(),
      expires_at: new Date(verified.expiresAt).toISOString()
    };
    store().sessions.set(session.id, session);
    player.last_seen_at = nowIso();
    if (event.status === "active" || event.status === "setup") {
      ensurePlayerAssignments(event);
    }
    return { token, player: { id: player.id, name: player.name } };
  },
  getPlayerView(token) {
    const { player } = requirePlayerSession(token);
    const event = requireEvent();
    ensurePlayerAssignments(event);
    const card = store().bingoCards.get(player.id) || null;
    const secret = [...store().secretTasks.values()].find((t) => t.player_id === player.id) || null;
    const target = store().targets.get(player.id) || null;
    const myBounties = store().bounties.map((b) => {
      const done = [...store().playerBounties.values()].find(
        (pb) => pb.player_id === player.id && pb.bounty_id === b.id
      );
      return { ...b, completed: Boolean(done?.completed) };
    });
    const txs = store().scores.filter((s) => s.player_id === player.id);
    const completedBingo = card?.cells.filter((c) => c.completed).length || 0;
    const completedBounties = myBounties.filter((b) => b.completed).length;
    return {
      event: {
        id: event.id,
        name: event.name,
        status: event.status,
        active_group_game: event.active_group_game,
        score_locked: event.score_locked,
        donation_ends_at: event.donation_ends_at,
        settlement_started_at: event.settlement_started_at
      },
      player: { id: player.id, name: player.name },
      score: playerScore(player.id),
      txs,
      bingo: card ? {
        ...card,
        cells: card.cells.map((c) => ({
          ...c,
          text: c.mystery && !c.revealed ? "\u795E\u79D8\u4EFB\u52D9" : c.text
        }))
      } : null,
      secret,
      target,
      bounties: myBounties,
      bountyRemaining: myBounties.filter((b) => !b.completed).length,
      completedBingo,
      completedBounties,
      groupGame: activeGroupGame(),
      messageSubmitted: [...store().messages.values()].some((m) => m.player_id === player.id),
      prizeDecision: store().prizeDecisions.get(player.id) || null,
      settlement: store().settlement,
      myRank: store().settlement?.rankings.find((r) => r.player_id === player.id) || null,
      donationTotal: [...store().prizeDecisions.values()].filter((d) => d.choice === "donate").length * 10,
      donors: [...store().prizeDecisions.values()].filter((d) => d.choice === "donate").length,
      // Names only — never include scores here.
      roster: publicPlayers().map((p) => ({ id: p.id, name: p.name })),
      messagesPublic: store().messages.size >= store().players.size && store().players.size > 0 ? [...store().messages.values()].map((m) => ({ id: m.id, text: m.text })) : [],
      messagesReady: store().messages.size >= store().players.size && store().players.size > 0
    };
  },
  revealMystery(token, cellId) {
    const { player } = requirePlayerSession(token);
    const card = store().bingoCards.get(player.id);
    if (!card) throw new Error("\u5C1A\u672A\u53D6\u5F97\u4E5D\u5BAE\u683C");
    const cell = card.cells.find((c) => c.id === cellId);
    if (!cell) throw new Error("\u683C\u5B50\u4E0D\u5B58\u5728");
    if (!cell.mystery) throw new Error("\u4E0D\u662F\u795E\u79D8\u984C");
    if (cell.revealed) return cell;
    cell.revealed = true;
    return cell;
  },
  completeBingoCell(token, cellId, photoDataUrl) {
    const { player } = requirePlayerSession(token);
    const event = requireEvent();
    assertNotLocked(event);
    const card = store().bingoCards.get(player.id);
    if (!card) throw new Error("\u5C1A\u672A\u53D6\u5F97\u4E5D\u5BAE\u683C");
    const cell = card.cells.find((c) => c.id === cellId);
    if (!cell) throw new Error("\u683C\u5B50\u4E0D\u5B58\u5728");
    if (cell.mystery && !cell.revealed) throw new Error("\u8ACB\u5148\u63ED\u66C9\u795E\u79D8\u4EFB\u52D9");
    if (cell.completed) throw new Error("\u6B64\u683C\u5DF2\u5B8C\u6210");
    if (!photoDataUrl?.startsWith("data:image/")) throw new Error("\u8ACB\u4E0A\u50B3\u7167\u7247");
    if (photoDataUrl.length > 18e5) throw new Error("\u7167\u7247\u592A\u5927\uFF0C\u8ACB\u58D3\u7E2E\u5F8C\u518D\u50B3");
    if (card.cells.some((c) => c.photo_data_url === photoDataUrl)) {
      throw new Error("\u9019\u5F35\u7167\u7247\u5DF2\u4F7F\u7528\u904E");
    }
    cell.photo_data_url = photoDataUrl;
    cell.completed = true;
    cell.completed_at = nowIso();
    addScore(event, player.id, "bingo", `cell_${cell.id}`, 1, cell.text);
    const { newLines, fullBonus } = computeBingoBonuses(card);
    for (const line of newLines) {
      card.line_bonuses.push(line);
      addScore(event, player.id, "bingo", `line_${card.id}_${line}`, 1, `\u9023\u7DDA ${line}`);
    }
    if (fullBonus) {
      card.full_bonus = true;
      addScore(event, player.id, "bingo", `full_${card.id}`, 2, "\u4E5D\u683C\u5168\u6EFF");
    }
    return this.getPlayerView(token);
  },
  completeSecret(token) {
    const { player } = requirePlayerSession(token);
    const event = requireEvent();
    const task = [...store().secretTasks.values()].find((t) => t.player_id === player.id);
    if (!task) throw new Error("\u6C92\u6709\u79D8\u5BC6\u4EFB\u52D9");
    if (task.completed) throw new Error("\u5DF2\u5B8C\u6210");
    task.completed = true;
    task.completed_at = nowIso();
    addScore(event, player.id, "secret_task", task.id, task.points, task.text);
    return this.getPlayerView(token);
  },
  completeTarget(token) {
    const { player } = requirePlayerSession(token);
    const event = requireEvent();
    const target = store().targets.get(player.id);
    if (!target) throw new Error("\u6C92\u6709\u61F8\u8CDE\u76EE\u6A19");
    if (target.completed) throw new Error("\u5DF2\u5B8C\u6210");
    target.completed = true;
    target.completed_at = nowIso();
    addScore(event, player.id, "target", target.id, target.points, target.text);
    return this.getPlayerView(token);
  },
  completeBounty(token, bountyId) {
    const { player } = requirePlayerSession(token);
    const event = requireEvent();
    const bounty = store().bounties.find((b) => b.id === bountyId);
    if (!bounty) throw new Error("\u61F8\u8CDE\u4E0D\u5B58\u5728");
    const key = `${player.id}_${bountyId}`;
    if ([...store().playerBounties.values()].some((pb) => pb.player_id === player.id && pb.bounty_id === bountyId && pb.completed)) {
      throw new Error("\u5DF2\u5B8C\u6210\u6B64\u61F8\u8CDE");
    }
    const row = {
      id: uid(),
      event_id: event.id,
      player_id: player.id,
      bounty_id: bountyId,
      completed: true,
      completed_at: nowIso()
    };
    store().playerBounties.set(key, row);
    addScore(event, player.id, "bounty", `${player.id}_${bountyId}`, bounty.points, bounty.text);
    return this.getPlayerView(token);
  },
  startDontCopyMe(adminToken) {
    requireAdmin(adminToken);
    const event = requireEvent();
    if (event.status !== "active") throw new Error("\u6D3B\u52D5\u5C1A\u672A\u958B\u59CB");
    const game = {
      id: uid(),
      event_id: event.id,
      kind: "dont_copy_me",
      status: "playing",
      round: 1,
      payload: {
        prompts: shuffle(DONT_COPY_PROMPTS).slice(0, 8),
        currentPromptIndex: 0,
        answers: {},
        scoredRounds: []
      },
      created_at: nowIso(),
      updated_at: nowIso()
    };
    store().groupGames.set(game.id, game);
    event.active_group_game = "dont_copy_me";
    event.group_game_id = game.id;
    event.last_group_game_at = nowIso();
    touch(event);
    return game;
  },
  submitDontCopyAnswer(token, text) {
    const { player } = requirePlayerSession(token);
    const game = activeGroupGame();
    if (!game || game.kind !== "dont_copy_me" || game.status !== "playing") {
      throw new Error("\u76EE\u524D\u6C92\u6709\u6B64\u904A\u6232");
    }
    const answers = game.payload.answers || {};
    const roundKey = String(game.round);
    answers[roundKey] = answers[roundKey] || {};
    answers[roundKey][player.id] = text.trim().slice(0, 40);
    game.payload.answers = answers;
    game.updated_at = nowIso();
    return true;
  },
  scoreDontCopyRound(adminToken, uniquePlayerIds) {
    requireAdmin(adminToken);
    const event = requireEvent();
    const game = activeGroupGame();
    if (!game || game.kind !== "dont_copy_me") throw new Error("\u904A\u6232\u4E0D\u5B58\u5728");
    const scored = game.payload.scoredRounds || [];
    if (scored.includes(game.round)) throw new Error("\u672C\u8F2A\u5DF2\u8A08\u5206");
    for (const pid of uniquePlayerIds) {
      addScore(event, pid, "group_game", `${game.id}_r${game.round}_${pid}`, 1, `\u4E0D\u8981\u8DDF\u6211\u4E00\u6A23 R${game.round}`);
    }
    scored.push(game.round);
    game.payload.scoredRounds = scored;
    game.status = "round_result";
    game.updated_at = nowIso();
    return game;
  },
  nextDontCopyRound(adminToken) {
    requireAdmin(adminToken);
    const game = activeGroupGame();
    if (!game || game.kind !== "dont_copy_me") throw new Error("\u904A\u6232\u4E0D\u5B58\u5728");
    const prompts = game.payload.prompts;
    if (game.round >= prompts.length) {
      return this.endGroupGame(adminToken);
    }
    game.round += 1;
    game.status = "playing";
    game.payload.currentPromptIndex = game.round - 1;
    game.updated_at = nowIso();
    return game;
  },
  startWhoWroteIt(adminToken) {
    requireAdmin(adminToken);
    const event = requireEvent();
    if (event.status !== "active") throw new Error("\u6D3B\u52D5\u5C1A\u672A\u958B\u59CB");
    const game = {
      id: uid(),
      event_id: event.id,
      kind: "who_wrote_it",
      status: "playing",
      round: 1,
      payload: {
        prompt: pick(WHO_WROTE_PROMPTS),
        answers: [],
        currentAnswerId: null,
        votes: {},
        revealedPlayerIds: []
      },
      created_at: nowIso(),
      updated_at: nowIso()
    };
    store().groupGames.set(game.id, game);
    event.active_group_game = "who_wrote_it";
    event.group_game_id = game.id;
    event.last_group_game_at = nowIso();
    touch(event);
    return game;
  },
  submitWhoWroteAnswer(token, text) {
    const { player } = requirePlayerSession(token);
    const game = activeGroupGame();
    if (!game || game.kind !== "who_wrote_it" || game.status !== "playing") {
      throw new Error("\u76EE\u524D\u7121\u6CD5\u4F5C\u7B54");
    }
    const answers = game.payload.answers;
    if (answers.some((a) => a.player_id === player.id)) throw new Error("\u5DF2\u63D0\u4EA4");
    answers.push({
      id: uid(),
      player_id: player.id,
      text: text.trim().slice(0, 200),
      revealed: false
    });
    game.payload.answers = answers;
    game.updated_at = nowIso();
    const playerCount = store().players.size;
    if (answers.length >= playerCount) {
      this.drawWhoWroteAnswer();
    }
    return true;
  },
  drawWhoWroteAnswer(adminToken) {
    if (adminToken) requireAdmin(adminToken);
    const game = activeGroupGame();
    if (!game || game.kind !== "who_wrote_it") throw new Error("\u904A\u6232\u4E0D\u5B58\u5728");
    const answers = game.payload.answers;
    const pool = answers.filter((a) => !a.revealed);
    if (!pool.length) {
      game.status = "finished";
      return game;
    }
    const drawn = pick(pool);
    game.payload.currentAnswerId = drawn.id;
    game.payload.votes = {};
    game.status = "voting";
    game.updated_at = nowIso();
    return game;
  },
  voteWhoWrote(token, guessedPlayerId) {
    const { player } = requirePlayerSession(token);
    const event = requireEvent();
    const game = activeGroupGame();
    if (!game || game.kind !== "who_wrote_it" || game.status !== "voting") {
      throw new Error("\u76EE\u524D\u7121\u6CD5\u6295\u7968");
    }
    const revealed = game.payload.revealedPlayerIds || [];
    if (revealed.includes(guessedPlayerId)) throw new Error("\u6B64\u73A9\u5BB6\u5DF2\u63ED\u66C9");
    const votes = game.payload.votes || {};
    if (votes[player.id]) throw new Error("\u5DF2\u6295\u7968");
    votes[player.id] = guessedPlayerId;
    game.payload.votes = votes;
    game.updated_at = nowIso();
    const playerCount = store().players.size;
    if (Object.keys(votes).length >= playerCount) {
      const answers = game.payload.answers;
      const currentId = game.payload.currentAnswerId;
      const answer = answers.find((a) => a.id === currentId);
      if (answer) {
        for (const [voterId, guess] of Object.entries(votes)) {
          if (guess === answer.player_id) {
            addScore(
              event,
              voterId,
              "who_wrote_it",
              `${game.id}_${currentId}_${voterId}`,
              1,
              "\u731C\u5C0D\u4F5C\u8005"
            );
          }
        }
        answer.revealed = true;
        revealed.push(answer.player_id);
        game.payload.revealedPlayerIds = revealed;
        game.payload.reveal = {
          player_id: answer.player_id,
          text: answer.text
        };
        game.status = "round_result";
      }
    }
    return true;
  },
  endGroupGame(adminToken) {
    requireAdmin(adminToken);
    const event = requireEvent();
    event.active_group_game = "none";
    event.group_game_id = null;
    event.last_group_game_at = nowIso();
    touch(event);
    return true;
  },
  startFinalButton(adminToken) {
    requireAdmin(adminToken);
    const event = requireEvent();
    if (event.score_locked) throw new Error("\u5DF2\u9396\u5206");
    const start = Date.now() + 3e3;
    const end = start + 1e4;
    const game = {
      id: uid(),
      event_id: event.id,
      kind: "final_button",
      status: "playing",
      round: 1,
      payload: {
        countdownEndsAt: start,
        endsAt: end,
        startedAt: start,
        finished: false
      },
      created_at: nowIso(),
      updated_at: nowIso()
    };
    store().groupGames.set(game.id, game);
    store().finalClicks.clear();
    event.status = "final_game";
    event.active_group_game = "final_button";
    event.group_game_id = game.id;
    touch(event);
    return game;
  },
  clickFinalButton(token, clientTs) {
    const { player } = requirePlayerSession(token);
    const event = requireEvent();
    const game = activeGroupGame();
    if (!game || game.kind !== "final_button") throw new Error("\u904A\u6232\u672A\u958B\u59CB");
    const now = Date.now();
    const start = Number(game.payload.startedAt);
    const end = Number(game.payload.endsAt);
    if (now < start) throw new Error("\u5C1A\u672A\u958B\u59CB");
    if (now > end || game.payload.finished) {
      this.finishFinalButton();
      throw new Error("\u6642\u9593\u5230");
    }
    if (Math.abs(clientTs - now) > 5e3) throw new Error("\u6642\u9593\u7570\u5E38");
    const row = store().finalClicks.get(player.id) || { count: 0, lastAt: 0, events: [] };
    if (now - row.lastAt < 40) {
      return { count: row.count };
    }
    row.count += 1;
    row.lastAt = now;
    row.events.push(now);
    if (row.events.length > 400) row.events = row.events.slice(-400);
    store().finalClicks.set(player.id, row);
    return { count: row.count };
  },
  finishFinalButton(adminToken) {
    if (adminToken) requireAdmin(adminToken);
    const event = requireEvent();
    const game = activeGroupGame();
    if (!game || game.kind !== "final_button") return null;
    if (game.payload.finished) return game;
    game.payload.finished = true;
    game.status = "finished";
    const ranked = [...store().finalClicks.entries()].map(([playerId, data]) => ({ playerId, count: data.count })).sort((a, b) => b.count - a.count);
    const points = [3, 2, 1];
    ranked.slice(0, 3).forEach((row, idx) => {
      try {
        addScore(
          event,
          row.playerId,
          "final_button",
          `${game.id}_${row.playerId}`,
          points[idx],
          `\u6309\u9215\u5927\u6230\u7B2C ${idx + 1} \u540D (${row.count} \u6B21)`
        );
      } catch {
      }
    });
    game.payload.results = ranked;
    event.active_group_game = "none";
    event.status = "message";
    touch(event);
    return game;
  },
  submitMessage(token, text) {
    const { player } = requirePlayerSession(token);
    const event = requireEvent();
    if (event.status !== "message" && event.status !== "active" && event.status !== "final_game") {
    }
    if ([...store().messages.values()].some((m) => m.player_id === player.id)) {
      throw new Error("\u5DF2\u9001\u51FA");
    }
    const cleaned = text.trim().slice(0, 280);
    if (!cleaned) throw new Error("\u8ACB\u8F38\u5165\u5167\u5BB9");
    store().messages.set(player.id, {
      id: uid(),
      event_id: event.id,
      player_id: player.id,
      text: cleaned,
      created_at: nowIso()
    });
    return true;
  },
  openMessages(adminToken) {
    requireAdmin(adminToken);
    const event = requireEvent();
    event.status = "message";
    touch(event);
    return [...store().messages.values()];
  },
  lockScores(adminToken) {
    requireAdmin(adminToken);
    const event = requireEvent();
    if (event.active_group_game === "final_button") this.finishFinalButton(adminToken);
    event.score_locked = true;
    event.status = "score_locked";
    event.active_group_game = "none";
    touch(event);
    return this.getAdminState();
  },
  startSettlement(adminToken, tieBreakOrder) {
    requireAdmin(adminToken);
    const event = requireEvent();
    if (!event.score_locked) throw new Error("\u8ACB\u5148\u9396\u5B9A\u7A4D\u5206");
    let ranked = rankings();
    if (tieBreakOrder?.length) {
      const order = new Map(tieBreakOrder.map((id, i) => [id, i]));
      ranked = [...ranked].sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        const ao = order.has(a.player_id) ? order.get(a.player_id) : 999;
        const bo = order.has(b.player_id) ? order.get(b.player_id) : 999;
        return ao - bo;
      }).map((row, i) => ({ ...row, rank: i + 1 }));
    }
    const settlement = {
      id: uid(),
      event_id: event.id,
      rankings: ranked.map((r) => ({
        player_id: r.player_id,
        rank: r.rank,
        score: r.score,
        prize: r.rank === 1 ? 1069 : r.rank === 2 ? 0 : r.rank === 3 ? 69 : 10
      })),
      tie_breaks: tieBreakOrder?.length ? [{ player_ids: tieBreakOrder, decided_order: tieBreakOrder }] : [],
      created_at: nowIso()
    };
    store().settlement = settlement;
    store().prizeDecisions.clear();
    for (const row of settlement.rankings) {
      if (row.rank >= 4) {
        store().prizeDecisions.set(row.player_id, {
          id: uid(),
          event_id: event.id,
          player_id: row.player_id,
          rank: row.rank,
          choice: null,
          amount: 10,
          decided_at: null,
          auto: false
        });
      }
    }
    event.status = "settlement";
    event.settlement_started_at = nowIso();
    event.donation_ends_at = new Date(Date.now() + 6e4).toISOString();
    touch(event);
    return settlement;
  },
  decidePrize(token, choice) {
    const { player } = requirePlayerSession(token);
    const event = requireEvent();
    if (event.status !== "settlement") throw new Error("\u5C1A\u672A\u958B\u59CB\u7D50\u7B97");
    const decision = store().prizeDecisions.get(player.id);
    if (!decision) throw new Error("\u4F60\u6C92\u6709\u8D08\u8207\u9078\u9805");
    if (decision.choice) throw new Error("\u5DF2\u6C7A\u5B9A\uFF0C\u4E0D\u80FD\u4FEE\u6539");
    const ends = event.donation_ends_at ? new Date(event.donation_ends_at).getTime() : 0;
    if (Date.now() > ends) {
      decision.choice = "keep";
      decision.auto = true;
      decision.decided_at = nowIso();
      throw new Error("\u6642\u9593\u5230\uFF0C\u5DF2\u81EA\u52D5\u9818\u53D6");
    }
    decision.choice = choice;
    decision.decided_at = nowIso();
    decision.auto = false;
    return this.getPlayerView(token);
  },
  finalizeDonationDefaults() {
    const event = requireEvent();
    if (!event.donation_ends_at) return;
    if (Date.now() < new Date(event.donation_ends_at).getTime()) return;
    for (const d of store().prizeDecisions.values()) {
      if (!d.choice) {
        d.choice = "keep";
        d.auto = true;
        d.decided_at = nowIso();
      }
    }
  },
  finishEvent(adminToken) {
    requireAdmin(adminToken);
    const event = requireEvent();
    this.finalizeDonationDefaults();
    event.status = "finished";
    touch(event);
    return this.getAdminState();
  },
  topTies() {
    const ranked = rankings();
    const ties = [];
    for (const score of new Set(ranked.map((r) => r.score))) {
      const group = ranked.filter((r) => r.score === score);
      if (group.length > 1 && group.some((g2) => g2.rank <= 3)) {
        ties.push({ score, players: group });
      }
    }
    return ties;
  },
  setStatus(adminToken, status) {
    requireAdmin(adminToken);
    const event = requireEvent();
    event.status = status;
    touch(event);
    return event;
  }
};

// src/lib/http-router.ts
async function routeApiRequest(input) {
  const method = input.method.toUpperCase();
  const path = input.path.replace(/^\/+|\/+$/g, "");
  const playerToken = input.headers.get("x-player-token") || "";
  const adminToken = input.headers.get("x-admin-token") || "";
  const body = input.body || {};
  try {
    await gameStore.load();
    let result;
    if (method === "GET" && path === "state") {
      result = { status: 200, data: gameStore.getPublicState() };
    } else if (method === "POST" && path === "auth/pin") {
      result = {
        status: 200,
        data: gameStore.setPlayerPin(String(body.playerId), String(body.pin), String(body.confirm))
      };
    } else if (method === "POST" && path === "auth/login") {
      result = {
        status: 200,
        data: gameStore.loginPlayer(String(body.playerId), String(body.pin))
      };
    } else if (method === "GET" && path === "me") {
      gameStore.finalizeDonationDefaults();
      result = { status: 200, data: gameStore.getPlayerView(playerToken) };
    } else if (method === "POST" && path === "bingo/reveal") {
      result = { status: 200, data: { cell: gameStore.revealMystery(playerToken, String(body.cellId)) } };
    } else if (method === "POST" && path === "bingo/complete") {
      result = {
        status: 200,
        data: gameStore.completeBingoCell(
          playerToken,
          String(body.cellId),
          String(body.photoDataUrl || "")
        )
      };
    } else if (method === "POST" && path === "tasks/secret") {
      result = { status: 200, data: gameStore.completeSecret(playerToken) };
    } else if (method === "POST" && path === "tasks/target") {
      result = { status: 200, data: gameStore.completeTarget(playerToken) };
    } else if (method === "POST" && path === "tasks/bounty") {
      result = {
        status: 200,
        data: gameStore.completeBounty(playerToken, String(body.bountyId))
      };
    } else if (method === "POST" && path === "games/dont-copy/answer") {
      gameStore.submitDontCopyAnswer(playerToken, String(body.text || ""));
      result = { status: 200, data: { ok: true } };
    } else if (method === "POST" && path === "games/who-wrote/answer") {
      gameStore.submitWhoWroteAnswer(playerToken, String(body.text || ""));
      result = { status: 200, data: { ok: true } };
    } else if (method === "POST" && path === "games/who-wrote/vote") {
      gameStore.voteWhoWrote(playerToken, String(body.guessedPlayerId));
      result = { status: 200, data: { ok: true } };
    } else if (method === "POST" && path === "games/final-button/click") {
      result = {
        status: 200,
        data: gameStore.clickFinalButton(playerToken, Number(body.clientTs || Date.now()))
      };
    } else if (method === "POST" && path === "messages") {
      gameStore.submitMessage(playerToken, String(body.text || ""));
      result = { status: 200, data: { ok: true } };
    } else if (method === "POST" && path === "settlement/decide") {
      const choice = body.choice === "donate" ? "donate" : "keep";
      result = { status: 200, data: gameStore.decidePrize(playerToken, choice) };
    } else if (method === "POST" && path === "admin/login") {
      result = { status: 200, data: gameStore.adminLogin(String(body.pin || "")) };
    } else if (method === "GET" && path === "admin/state") {
      gameStore.requireAdmin(adminToken);
      gameStore.finalizeDonationDefaults();
      result = { status: 200, data: gameStore.getAdminState() };
    } else if (method === "POST" && path === "admin/action") {
      const action = String(body.action || "");
      switch (action) {
        case "activate":
          result = { status: 200, data: gameStore.activateEvent(adminToken) };
          break;
        case "create_player":
          result = { status: 200, data: gameStore.createPlayer(adminToken, String(body.name || "")) };
          break;
        case "rename_player":
          result = {
            status: 200,
            data: gameStore.renamePlayer(adminToken, String(body.playerId), String(body.name || ""))
          };
          break;
        case "delete_player":
          result = { status: 200, data: { ok: gameStore.deletePlayer(adminToken, String(body.playerId)) } };
          break;
        case "adjust_score":
          result = {
            status: 200,
            data: gameStore.adjustScore(
              adminToken,
              String(body.playerId),
              Number(body.points || 0),
              String(body.note || "")
            )
          };
          break;
        case "start_dont_copy":
          result = { status: 200, data: gameStore.startDontCopyMe(adminToken) };
          break;
        case "score_dont_copy":
          result = {
            status: 200,
            data: gameStore.scoreDontCopyRound(adminToken, body.uniquePlayerIds || [])
          };
          break;
        case "next_dont_copy":
          result = { status: 200, data: gameStore.nextDontCopyRound(adminToken) };
          break;
        case "start_who_wrote":
          result = { status: 200, data: gameStore.startWhoWroteIt(adminToken) };
          break;
        case "draw_who_wrote":
          result = { status: 200, data: gameStore.drawWhoWroteAnswer(adminToken) };
          break;
        case "end_group_game":
          result = { status: 200, data: { ok: gameStore.endGroupGame(adminToken) } };
          break;
        case "start_final_button":
          result = { status: 200, data: gameStore.startFinalButton(adminToken) };
          break;
        case "finish_final_button":
          result = { status: 200, data: gameStore.finishFinalButton(adminToken) };
          break;
        case "open_messages":
          result = { status: 200, data: gameStore.openMessages(adminToken) };
          break;
        case "lock_scores":
          result = { status: 200, data: gameStore.lockScores(adminToken) };
          break;
        case "start_settlement":
          result = {
            status: 200,
            data: gameStore.startSettlement(adminToken, body.tieBreakOrder)
          };
          break;
        case "finish_event":
          result = { status: 200, data: gameStore.finishEvent(adminToken) };
          break;
        case "top_ties":
          gameStore.requireAdmin(adminToken);
          result = { status: 200, data: { ties: gameStore.topTies() } };
          break;
        default:
          result = { status: 400, data: { error: "\u672A\u77E5\u64CD\u4F5C" } };
      }
    } else {
      result = { status: 404, data: { error: `\u627E\u4E0D\u5230 API: ${method} /${path}` } };
    }
    if (result.status < 400) {
      await gameStore.save();
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "\u932F\u8AA4";
    const status = message.includes("\u672A\u767B\u5165") || message.includes("\u8ACB\u91CD\u65B0\u767B\u5165") || message.includes("\u7BA1\u7406\u54E1\u672A\u767B\u5165") ? 401 : 400;
    return { status, data: { error: message } };
  }
}

// scripts/vercel-api-entry.ts
async function handler(req, res) {
  try {
    const parts = req.query.path;
    const path = Array.isArray(parts) ? parts.join("/") : String(parts || "");
    const headers = {
      get(name) {
        const value = req.headers[name.toLowerCase()];
        if (Array.isArray(value)) return value[0] || null;
        return value ?? null;
      }
    };
    const result = await routeApiRequest({
      method: req.method || "GET",
      path,
      headers,
      body: req.body
    });
    res.status(result.status).json(result.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "\u4F3A\u670D\u5668\u932F\u8AA4";
    console.error("api handler error", error);
    res.status(500).json({ error: message });
  }
}
