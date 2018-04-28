# Copyright (c) 2017-present, Facebook, Inc.
# All rights reserved.
#
# This source code is licensed under the license found in the
# LICENSE file in the root directory of this source tree.
#

import json,sys,os

output_path = 'output/'

def json_save(path, obj):
	with open(path, 'w') as f:
		json.dump(obj, f)

def os_mkdir(path):
	if not os.path.exists(path):
		os.mkdir(path)

def makePartialJsons(obj):
	for k in obj['data']:
		os_mkdir(output_path)
		output_f = os.path.join(output_path, k+'.json')
		json_save(output_f, obj['data'][k])
		print(k)

if __name__=='__main__' and len(sys.argv) > 1:
    path = sys.argv[1]
    with open(path, 'r') as f:
        obj = json.load(f)
        makePartialJsons(obj)
