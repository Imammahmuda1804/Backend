"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateDestinationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_destination_dto_1 = require("./create-destination.dto");
class UpdateDestinationDto extends (0, swagger_1.PartialType)(create_destination_dto_1.CreateDestinationDto) {
}
exports.UpdateDestinationDto = UpdateDestinationDto;
//# sourceMappingURL=update-destination.dto.js.map