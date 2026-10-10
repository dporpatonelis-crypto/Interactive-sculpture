#!/usr/bin/env python3
"""Partition the lightweight Symbolic_Table_VR GLB into six radial light regions.

Usage: python3 tools/partition-circular-table.py input.glb models/circular-table-regions.glb
The output keeps every source triangle, vertex attribute, material and texture.
"""

import json
import math
import struct
import sys
from pathlib import Path


def main(source_path, output_path):
    source = Path(source_path).read_bytes()
    if struct.unpack_from('<4sII', source) != (b'glTF', 2, len(source)):
        raise ValueError('Expected a complete GLB 2.0 file')
    json_length, json_type = struct.unpack_from('<I4s', source, 12)
    if json_type != b'JSON':
        raise ValueError('Missing JSON chunk')
    document = json.loads(source[20:20 + json_length])
    bin_header = 20 + json_length
    bin_length, bin_type = struct.unpack_from('<I4s', source, bin_header)
    if bin_type != b'BIN\0':
        raise ValueError('Missing BIN chunk')
    binary = bytearray(source[bin_header + 8:bin_header + 8 + bin_length])
    if len(document['meshes']) != 1 or len(document['meshes'][0]['primitives']) != 1:
        raise ValueError('Expected the supplied single-mesh table')
    primitive = document['meshes'][0]['primitives'][0]
    positions = document['accessors'][primitive['attributes']['POSITION']]
    indices = document['accessors'][primitive['indices']]
    if positions['componentType'] != 5126 or positions['type'] != 'VEC3':
        raise ValueError('Expected float32 vertex positions')
    if indices['componentType'] != 5123 or indices['type'] != 'SCALAR' or indices['count'] % 3:
        raise ValueError('Expected uint16 triangle indices')
    position_view = document['bufferViews'][positions['bufferView']]
    index_view = document['bufferViews'][indices['bufferView']]
    position_offset = position_view.get('byteOffset', 0) + positions.get('byteOffset', 0)
    index_offset = index_view.get('byteOffset', 0) + indices.get('byteOffset', 0)
    vertices = list(struct.iter_unpack('<3f', binary[position_offset:position_offset + positions['count'] * 12]))
    source_indices = struct.unpack_from(f"<{indices['count']}H", binary, index_offset)
    sectors = [[] for _ in range(6)]
    for offset in range(0, len(source_indices), 3):
        triangle = source_indices[offset:offset + 3]
        x = sum(vertices[index][0] for index in triangle) / 3
        z = sum(vertices[index][2] for index in triangle) / 3
        angle = math.atan2(x, z)
        sector = int(((angle + math.pi / 6) % (2 * math.pi)) / (math.pi / 3))
        sectors[sector].extend(triangle)
    if any(not sector for sector in sectors):
        raise ValueError('A radial light region has no triangles')

    root_node = document['nodes'][0]
    root_node.pop('mesh', None)
    root_node['name'] = 'Circular_Table_of_the_Church'
    root_node['children'] = []
    document['meshes'] = []
    for index, values in enumerate(sectors, 1):
        while len(binary) % 4:
            binary.append(0)
        byte_offset = len(binary)
        binary.extend(struct.pack(f'<{len(values)}H', *values))
        view_index = len(document['bufferViews'])
        document['bufferViews'].append({
            'buffer': 0, 'byteOffset': byte_offset,
            'byteLength': len(values) * 2, 'target': 34963,
        })
        accessor_index = len(document['accessors'])
        document['accessors'].append({
            'bufferView': view_index, 'componentType': 5123, 'count': len(values),
            'min': [min(values)], 'max': [max(values)], 'type': 'SCALAR',
        })
        name = f'Table_sector_{index}'
        document['meshes'].append({
            'name': name,
            'primitives': [dict(primitive, indices=accessor_index)],
        })
        root_node['children'].append(len(document['nodes']))
        document['nodes'].append({'name': name, 'mesh': index - 1})
    document['buffers'][0]['byteLength'] = len(binary)
    json_bytes = json.dumps(document, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    json_bytes += b' ' * (-len(json_bytes) % 4)
    binary += b'\0' * (-len(binary) % 4)
    payload = (struct.pack('<I4s', len(json_bytes), b'JSON') + json_bytes +
               struct.pack('<I4s', len(binary), b'BIN\0') + binary)
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    Path(output_path).write_bytes(struct.pack('<4sII', b'glTF', 2, 12 + len(payload)) + payload)
    print(', '.join(f'sector {i}: {len(values) // 3}' for i, values in enumerate(sectors, 1)))


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
